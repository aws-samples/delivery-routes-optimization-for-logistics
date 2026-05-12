import { PolicyStatements, ddbReadActions, ddbWriteActions, ddbBatchWriteActions } from '../../../src/utils/policies'

describe('PolicyStatements', () => {
  describe('ssm.readParams', () => {
    it('includes correct actions and resource pattern', () => {
      const stmt = PolicyStatements.ssm.readParams('us-east-1', '123456789012')
      const json = stmt.toJSON()

      expect(json.Action).toEqual(['ssm:GetParameter', 'ssm:GetParameters', 'ssm:GetParametersByPath'])
      expect([json.Resource].flat()).toEqual(['arn:aws:ssm:us-east-1:123456789012:parameter/*'])
      expect(json.Effect).toBe('Allow')
    })
  })

  describe('s3.readBucket', () => {
    it('includes GetObject and ListBucket with arn and arn/*', () => {
      const arn = 'arn:aws:s3:::my-bucket'
      const stmt = PolicyStatements.s3.readBucket(arn)
      const json = stmt.toJSON()

      expect(json.Action).toContain('s3:GetObject')
      expect(json.Action).toContain('s3:ListBucket')
      expect(json.Resource).toEqual([arn, `${arn}/*`])
    })
  })

  describe('s3.writeBucket', () => {
    it('includes PutObject, ListBucket, and GetObject', () => {
      const arn = 'arn:aws:s3:::my-bucket'
      const stmt = PolicyStatements.s3.writeBucket(arn)
      const json = stmt.toJSON()

      expect(json.Action).toContain('s3:PutObject')
      expect(json.Action).toContain('s3:ListBucket')
      expect(json.Action).toContain('s3:GetObject')
      expect(json.Resource).toEqual([arn, `${arn}/*`])
    })
  })

  describe('ddb.readDDBTable', () => {
    it('includes index/* in resources', () => {
      const arn = 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'
      const stmt = PolicyStatements.ddb.readDDBTable(arn)
      const json = stmt.toJSON()

      expect([json.Action].flat()).toEqual(ddbReadActions)
      expect([json.Resource].flat()).toContain(arn)
      expect([json.Resource].flat()).toContain(`${arn}/index/*`)
    })
  })

  describe('ddb.updateDDBTable', () => {
    it('includes PutItem, UpdateItem, DeleteItem', () => {
      const arn = 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'
      const stmt = PolicyStatements.ddb.updateDDBTable(arn)
      const json = stmt.toJSON()

      expect([json.Action].flat()).toEqual(ddbWriteActions)
      expect([json.Resource].flat()).toEqual([arn])
    })
  })

  describe('ddb.batchWriteDDBTable', () => {
    it('includes BatchWriteItem', () => {
      const arn = 'arn:aws:dynamodb:us-east-1:123456789012:table/MyTable'
      const stmt = PolicyStatements.ddb.batchWriteDDBTable(arn)
      const json = stmt.toJSON()

      expect([json.Action].flat()).toEqual(ddbBatchWriteActions)
      expect([json.Resource].flat()).toEqual([arn])
    })
  })
})
