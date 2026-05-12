import { App, Stack } from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { AppNodejsFunction } from '../../../src/constructs/NodejsFn'

/**
 * Property 4: Lambda runtime invariant
 * Validates: Requirements 3.6, 3.7, 3.8, 10.3, 12.5
 *
 * All AppNodejsFunction instances must produce AWS::Lambda::Function
 * resources with Runtime: "nodejs24.x"
 */
describe('Property 4: Lambda runtime invariant', () => {
  it('all AppNodejsFunction instances have Runtime nodejs24.x', () => {
    const app = new App()
    const stack = new Stack(app, 'TestStack')

    new AppNodejsFunction(stack, 'Fn1', {
      handlerPath: '_test_fixture/index.ts',
    })

    new AppNodejsFunction(stack, 'Fn2', {
      handlerPath: '_test_fixture/index.ts',
      memorySize: 512,
    })

    new AppNodejsFunction(stack, 'Fn3', {
      handlerPath: '_test_fixture/index.ts',
      environment: { FOO: 'bar' },
    })

    const template = Template.fromStack(stack)
    const functions = template.findResources('AWS::Lambda::Function')

    const runtimes = Object.values(functions).map(
      (fn: Record<string, unknown>) => (fn.Properties as Record<string, unknown>).Runtime,
    )

    expect(runtimes.length).toBeGreaterThanOrEqual(3)
    for (const runtime of runtimes) {
      expect(runtime).toBe('nodejs24.x')
    }
  })
})

/**
 * Property 7: Handler entry file existence
 * Validates: Requirements 3.6, 3.7, 3.8, 10.3, 12.5
 *
 * Passing a non-existent handlerPath results in an error during synth.
 */
describe('Property 7: Handler entry file existence', () => {
  it('throws error when handlerPath does not exist', () => {
    const app = new App()
    const stack = new Stack(app, 'TestStack')

    expect(() => {
      new AppNodejsFunction(stack, 'BadFn', {
        handlerPath: 'non-existent/path/handler.ts',
      })
    }).toThrow()
  })

  it('does not throw when handlerPath exists', () => {
    const app = new App()
    const stack = new Stack(app, 'TestStack')

    expect(() => {
      new AppNodejsFunction(stack, 'GoodFn', {
        handlerPath: '_test_fixture/index.ts',
      })
    }).not.toThrow()
  })
})
