/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

console.log('Loading function')
const aws = require('aws-sdk')

const s3 = new aws.S3({ apiVersion: '2006-03-01' })
const ddb = new aws.DynamoDB({ apiVersion: '2012-08-10' })
const lambda = new aws.Lambda({ apiVersion: '2015-03-31' })
const { parse } = require('csv-parse/sync')
const { v4 } = require('uuid')

const TABLE_NAME = process.env.TABLE_NAME
const ORDER_DISPATCH_LAMBDA_NAME = process.env.ORDER_DISPATCH_LAMBDA_NAME

const util = {
  numberItem: function (data) {
    if (!data) return
    const value = data.replace(/,/g, '').trim()

    if (!isNaN(value)) return { N: value }
  },
  stringItem: function (data) {
    if (data) return { S: data }
  },
  booleanItem: function (data, trueValue, falseValue, defaultResult) {
    let res = !!defaultResult

    if (data === trueValue) res = true
    else if (data === falseValue) res = false

    return { BOOL: res }
  },
  buildDdbWriteRequest: function (records, columns, ddbTableName, dataTypeConverter) {
    const MAX_DDB_BATCH_COUNT = 25
    const CREATED = `${new Date().getTime()}`
    const requestList = []

    for (let i = 0; i < records.length; i += MAX_DDB_BATCH_COUNT) {
      const ddbParams = { RequestItems: {} }
      const itemList = []
      const clusterBound = Math.min(records.length, i + MAX_DDB_BATCH_COUNT)
      for (let r = i; r < clusterBound; r++) {
        const item = {
          Id: { S: v4() },
          createdAt: { N: CREATED },
          updatedAt: { N: CREATED },
        }
        for (let c = 0; c < columns.length; c++) {
          const colName = columns[c]
          const colData = records[r][colName]
          const ddbItem = dataTypeConverter(colName, colData)

          if (ddbItem) item[colName] = ddbItem
        }

        itemList.push({ PutRequest: { Item: item } })
        console.log(JSON.stringify(item))
      }
      ddbParams.RequestItems[ddbTableName] = itemList
      requestList.push(ddbParams)
    }

    return requestList
  },
}

const OrderDataConverter = function (colName, data) {
  if (['sumWeight'].indexOf(colName) >= 0) {
    return util.numberItem(data)
  } else {
    return util.stringItem(data)
  }
}

const invokeOrderDispatchLambda = async function (warehouseCode, orderDate) {
  const invokeReq = lambda
    .invokeAsync({
      FunctionName: ORDER_DISPATCH_LAMBDA_NAME,
      InvokeArgs: JSON.stringify({ warehouseCode, orderDate }),
    })
    .promise()

  return await invokeReq
}

const createOrderBatch = async (event) => {
  try {
    // Uploaded file info
    const bucket = event.Records[0].s3.bucket.name
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '))
    const params = { Bucket: bucket, Key: key }
    console.log('File uploaded - ' + key)

    const [_, warehouseCode, orderDate] = key.split('.')[0].split('_')
    console.log(`Warehouse : ${warehouseCode}`)
    console.log(`Order Date : ${orderDate}`)

    // load data from S3 bucket
    const { Body } = await s3.getObject(params).promise()
    console.log('---data---')
    console.log(Body.toString('UTF-8'))

    // parse csv file
    const OrderColNames = ['orderNo','orderDate','warehouseCode','deliveryCode','deliveryName','sumWeight']
    const parseOptions = { columns: OrderColNames, delimiter: ',', from_line: 2 }
    const csvRecords = parse(Body, parseOptions)
    console.log('--records length--')
    console.log(csvRecords.length)
    console.log('--records--')
    console.log(csvRecords)

    // DynamoDB Write
    console.log('--[ DynamoDB Write Result ]--------------------')
    const reqs = util.buildDdbWriteRequest(
      csvRecords,
      OrderColNames,
      TABLE_NAME,
      OrderDataConverter,
    )
    for (let j = 0; j < reqs.length; j++) {
      const writeTableInfo = Object.keys(reqs[j].RequestItems)[0]
      const writeItemCount = reqs[j].RequestItems[writeTableInfo].length
      console.log(`[ #${j} -> ${writeTableInfo} ] write ${writeItemCount} items ...`)

      const putRes = await ddb.batchWriteItem(reqs[j]).promise()

      console.log(putRes)
    }

    // start optimize job
    await invokeOrderDispatchLambda(warehouseCode, orderDate)

    return 0
  } catch (err) {
    console.log(err)
    throw new Error(err)
  }
}

exports.handler = async (event) => {
  const promise = new Promise(async function(resolve, reject) {
    try{
      const result = await createOrderBatch(event);
      resolve(result)
    } catch(e) {
      reject(e)
    }
  });

  return promise;
}
