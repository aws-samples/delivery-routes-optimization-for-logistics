#!/bin/bash

# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# Account info
PROFILE=route-opt
REGION=ap-northeast-2
ACCOUNT_ID=$(aws sts get-caller-identity --profile $PROFILE --region $REGION --output json | jq .Account --raw-output)

# DynamoDB table names
DDB_WAREHOUSE=$(aws ssm get-parameter --profile $PROFILE --region $REGION --name /DevProto/Ddb/Warehouses/TableName | jq --raw-output ".Parameter.Value")
DDB_CUSTOMER_LOCATIONS=$(aws ssm get-parameter --profile $PROFILE --region $REGION --name /DevProto/Ddb/CustomerLocations/TableName | jq --raw-output ".Parameter.Value")
DDB_VEHICLES=$(aws ssm get-parameter --profile $PROFILE --region $REGION --name /DevProto/Ddb/Vehicles/TableName | jq --raw-output ".Parameter.Value")

# Upload data
echo "-----------------------------"
echo "Upload master Data"
echo "-----------------------------"
echo "> region : $REGION"
echo "> account : $ACCOUNT_ID"
echo ""

echo "  [1] Warehouse data ..."
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_WAREHOUSE --item '{"Id":{"S":"efe96b73-4c6c-4c66-a1bb-fc3eaf3e32ef"},"warehouseCode":{"S":"95001200"},"warehouseName":{"S":"Seoul Station"},"address":{"S":"Jung-Gu Seoul Korea"},"latitude":{"N":"37.5577857"},"longitude":{"N":"126.9697484"}}'

echo "  [2] Customer Location data ..."
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"efe96b73-4c6c-4c66-a1bb-fc3eaf3e32ef"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"95001200"},"deliveryName":{"S":"Seoul Station"},"address":{"S":"Jung-Gu Seoul Korea"},"latitude":{"N":"37.5577857"},"longitude":{"N":"126.9697484"},"deliveryTimeGroup":{"S":"0"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"e102787d-76bb-404f-b02b-a72e1762a6a3"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10000010"},"deliveryName":{"S":"E1 Hospital"},"address":{"S":"Gangseo-Gu Seoul Korea"},"latitude":{"N":"37.557948"},"longitude":{"N":"126.8366528"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"ed354a82-3004-44a7-b661-8d32f3ea863e"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10001200"},"deliveryName":{"S":"H Hospital"},"address":{"S":"Gangseo-Gu Seoul Korea"},"latitude":{"N":"37.5591924"},"longitude":{"N":"126.840646"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"ea9eb5b0-3d81-4835-aa85-1a0fcb71bd98"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10002561"},"deliveryName":{"S":"MM Hospital"},"address":{"S":"Gangseo-Gu Seoul Korea"},"latitude":{"N":"37.5521496"},"longitude":{"N":"126.8359888"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"d4c56189-d747-42b5-8f77-5f4150b88b40"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10002566"},"deliveryName":{"S":"B Hospital"},"address":{"S":"Gangseo-Gu Seoul Korea"},"latitude":{"N":"37.556895"},"longitude":{"N":"126.850927"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"53ef19df-9b03-4464-a8cd-2aadd3f15543"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10000020"},"deliveryName":{"S":"YS Hospital"},"address":{"S":"Seodaemun-Gu Seoul Korea"},"latitude":{"N":"37.5623371"},"longitude":{"N":"126.9408692"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"1833d62d-e51f-4273-8cef-c70dfc742b07"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10002622"},"deliveryName":{"S":"YW Clinic"},"address":{"S":"Mapo-Gu Seoul Korea"},"latitude":{"N":"37.5536117"},"longitude":{"N":"126.9367568"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"208263df-b3c2-46a4-8da0-6979ee58784d"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10002685"},"deliveryName":{"S":"ME Hospital"},"address":{"S":"Mapo-Gu Seoul Korea"},"latitude":{"N":"37.5547141"},"longitude":{"N":"126.9550842"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"9d975e88-809b-40fc-9e6b-327e49bc5d65"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10002755"},"deliveryName":{"S":"YY Clinic"},"address":{"S":"Mapo-Gu Seoul Korea"},"latitude":{"N":"37.5560351"},"longitude":{"N":"126.9234474"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"30e840ee-2235-4ade-9305-2faf257c63ad"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10002057"},"deliveryName":{"S":"S Hospital"},"address":{"S":"Mapo-Gu Seoul Korea"},"latitude":{"N":"37.5525322"},"longitude":{"N":"126.9337129"},"deliveryTimeGroup":{"S":"1"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"6ee2fd11-e06b-4fa4-99cc-6d8b84ccb255"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10000030"},"deliveryName":{"S":"E2 Hospital"},"address":{"S":"Yangcheon-Gu Seoul Korea"},"latitude":{"N":"37.5363794"},"longitude":{"N":"126.8864324"},"deliveryTimeGroup":{"S":"2"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"7fb3f9cc-b025-4737-b0f7-892eec18afce"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10000568"},"deliveryName":{"S":"MH Hospital"},"address":{"S":"Yangcheon-Gu Seoul Korea"},"latitude":{"N":"37.5249624"},"longitude":{"N":"126.8768007"},"deliveryTimeGroup":{"S":"2"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_CUSTOMER_LOCATIONS --item '{"Id":{"S":"f735ff6a-16b9-40e3-b274-074044c7d821"},"warehouseCode":{"S":"95001200"},"deliveryCode":{"S":"10000724"},"deliveryName":{"S":"HH Hospital"},"address":{"S":"Yangcheon-Gu Seoul Korea"},"latitude":{"N":"37.5284349"},"longitude":{"N":"126.8636189"},"deliveryTimeGroup":{"S":"2"}}'

echo "  [3] Vehicle data ..."
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"148bf5ed-127d-467a-99b1-a43688a552de"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"170801"},"carGrade":{"S":"1 Ton"},"maxWeight":{"N":"8000"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"cc513fa5-2fe5-497e-a9ab-e355dbe60584"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"170802"},"carGrade":{"S":"1 Ton"},"maxWeight":{"N":"8000"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"0183c948-9c79-45d8-978f-415e5160a5f4"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"170803"},"carGrade":{"S":"1 Ton"},"maxWeight":{"N":"8000"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"b249dac3-0359-4ccb-83db-38f8d7650080"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"170804"},"carGrade":{"S":"1 Ton"},"maxWeight":{"N":"8000"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"58e3f79b-8106-4a42-85c8-60f0679c695e"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"252020"},"carGrade":{"S":"2.5 Ton"},"maxWeight":{"N":"20000"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"42571e32-4920-4b0c-90ba-b4f64c6b1a32"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"252021"},"carGrade":{"S":"2.5 Ton"},"maxWeight":{"N":"20000"}}'
aws dynamodb put-item --profile $PROFILE --region $REGION --table-name $DDB_VEHICLES --item '{"Id":{"S":"5653ce61-3ca4-4dbb-b14a-9d01db24bc4f"},"warehouseCode":{"S":"95001200"},"carNo":{"S":"505596"},"carGrade":{"S":"5 Ton"},"maxWeight":{"N":"40000"}}'

echo ""
echo "Done."
