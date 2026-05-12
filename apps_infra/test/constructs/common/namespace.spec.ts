import { App, Stack } from 'aws-cdk-lib'
import { setNamespace, namespaced, namespacedBucket, regionalNamespaced } from '../../../src/utils/namespace'

describe('namespace helpers', () => {
  describe('namespaced', () => {
    it('returns ${ns}-${name} when context is set', () => {
      const app = new App()
      const stack = new Stack(app, 'TestStack')
      setNamespace(stack, 'devproto')

      expect(namespaced(stack, 'MyResource')).toBe('devproto-MyResource')
    })

    it('returns just name when context is not set', () => {
      const app = new App()
      const stack = new Stack(app, 'TestStack')

      expect(namespaced(stack, 'MyResource')).toBe('MyResource')
    })
  })

  describe('namespacedBucket', () => {
    it('returns lowercase result', () => {
      const app = new App()
      const stack = new Stack(app, 'TestStack')
      setNamespace(stack, 'DevProto')

      expect(namespacedBucket(stack, 'OrderUploads')).toBe('devproto-orderuploads')
    })

    it('returns lowercase name without namespace', () => {
      const app = new App()
      const stack = new Stack(app, 'TestStack')

      expect(namespacedBucket(stack, 'OrderUploads')).toBe('orderuploads')
    })
  })

  describe('regionalNamespaced', () => {
    it('includes region prefix', () => {
      const app = new App()
      const stack = new Stack(app, 'TestStack', { env: { region: 'us-east-1', account: '123456789012' } })
      setNamespace(stack, 'devproto')

      expect(regionalNamespaced(stack, 'Cache')).toBe('us-east-1-devproto-Cache')
    })

    it('includes region prefix without namespace', () => {
      const app = new App()
      const stack = new Stack(app, 'TestStack', { env: { region: 'eu-west-1', account: '123456789012' } })

      expect(regionalNamespaced(stack, 'Cache')).toBe('eu-west-1-Cache')
    })
  })
})
