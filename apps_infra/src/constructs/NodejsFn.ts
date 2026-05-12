import * as path from 'node:path'
import { Construct } from 'constructs'
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs'
import { LAMBDA_DEFAULTS } from '../constants'

export interface AppNodejsFunctionProps extends Omit<NodejsFunctionProps, 'runtime' | 'entry'> {
  /** lambda 디렉토리 기준 상대 경로 e.g. 'api-web/customer-location-manager/index.ts' */
  readonly handlerPath: string
}

export const LAMBDA_ROOT = path.resolve(process.cwd(), 'lambda')

export class AppNodejsFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: AppNodejsFunctionProps) {
    const { handlerPath, bundling, ...rest } = props
    super(scope, id, {
      ...LAMBDA_DEFAULTS,
      ...rest,
      entry: path.join(LAMBDA_ROOT, handlerPath),
      bundling: {
        target: 'node24',
        minify: true,
        sourceMap: true,
        externalModules: ['@aws-sdk/*'],
        ...bundling,
      },
    })
  }
}
