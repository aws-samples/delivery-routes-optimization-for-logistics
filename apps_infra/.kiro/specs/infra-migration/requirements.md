# Requirements Document — Infra Migration

## Introduction

본 문서는 `delivery-routes-optimization-for-logistics/apps/infra` (lerna + yarn-workspaces 기반 CDK 앱, 8개 `@infra/*` 내부 패키지 의존) 를 `apps_infra/` 단일 pnpm 패키지로 재작성하기 위한 요구사항을 정의한다. 요구사항은 이미 승인된 [design.md](./design.md) 와 [migration-decisions.md](../../../docs/migration-decisions.md) (D1~D10) 에서 역산하여 도출되었으며, EARS 패턴과 INCOSE 품질 규칙을 준수한다.

Design 원문 대응 관계 요약:

- High-Level Design §1.1 ~ §1.9 → Requirements 1, 2, 3, 14, 15
- Low-Level Design §2.1 ~ §2.3 → Requirements 1
- §2.4 Config 로더 → Requirements 2
- §2.6 bin/app.ts → Requirements 4
- §2.7 Constants, §1.6 Lambda 재작성 방침 → Requirements 10
- §2.8 AppNodejsFunction, §2.9 Common Constructs/Policies → Requirements 3
- 스택별 Construct (§2.9) → Requirements 5, 6, 7, 8, 9
- §1.7 Stub → Requirements 11
- §2.11 테스트 → Requirements 12
- §1.9, §2.1 scripts → Requirements 13
- §2.15 단계 체크포인트 → Requirements 15
- §1.8 CDK v2 breaking change 체크리스트 → Requirements 14

## Glossary

- **Apps_Infra_Project**: `apps_infra/` 디렉토리에 존재하는 신규 단일 pnpm 패키지. CDK 앱, Lambda 소스, stub, config, test 를 모두 포함한다.
- **CDK_App**: `bin/app.ts` 를 엔트리포인트로 하는 CDK 애플리케이션 인스턴스.
- **Stack_Set**: PersistentBackendStack, BackendStack, OrderUploadStack, DistanceCacheStack, OptimizationEngineStack 5개 CloudFormation 스택.
- **Persistent_Stack**: `PersistentBackendStack` 인스턴스. VPC, DataStorage NestedStack, IdentityStack NestedStack, WebsiteHosting 을 포함한다.
- **Backend_Stack**: `BackendStack` 인스턴스. ApiWeb Lambda 엔드포인트, HostingDeployment, AppVariables 를 포함한다.
- **OrderUpload_Stack**: `OrderUploadStack` 인스턴스. ApiOrder 업로드/디스패치 엔드포인트를 포함한다.
- **DistanceCache_Stack**: `DistanceCacheStack` 인스턴스. distancecache-util ECS EC2 Task 를 포함한다.
- **OptEngine_Stack**: `OptimizationEngineStack` 인스턴스. nextday-delivery ECS EC2 Task 를 포함한다.
- **Config_Loader**: `src/config/loader.ts` 의 `loadConfig` 함수와 `src/config/schema.ts` 의 Zod 스키마 집합.
- **Root_Config**: `RootConfigSchema` 가 검증한 최상위 설정 객체. env, namespace, assets, instanceOptions, parameterStoreKeys 등을 포함한다.
- **App_NodejsFunction**: `src/constructs/common/NodejsFn.ts` 의 `AppNodejsFunction` 클래스. 모든 Lambda 의 생성 단일 진입점.
- **Lambda_Runtime_Constant**: `src/constants.ts` 의 `LAMBDA_RUNTIME = Runtime.NODEJS_24_X` 상수.
- **Lambda_Source_Root**: `apps_infra/lambda/` 디렉토리. NodejsFunction 엔트리 파일이 위치한다.
- **Website_Stub**: `apps_infra/stub/website/index.html` 단일 파일로 구성된 CloudFront 배포용 정적 자산.
- **OptEngine_Stub**: `apps_infra/stub/opt-engine/{distancecache-util,nextday-delivery}/Dockerfile` 두 개의 nginx 헬스체크 전용 Dockerfile.
- **Namespace_Helper**: `src/constructs/common/namespace.ts` 의 `namespaced`, `namespacedBucket`, `regionalNamespaced`, `setNamespace` 함수.
- **Policy_Statements_Helper**: `src/constructs/common/policies.ts` 의 `PolicyStatements` 객체 (SSM/S3/DDB 헬퍼).
- **Parameter_Store_Keys**: `Root_Config.parameterStoreKeys` 에 나열된 SSM Parameter Store 경로 사전.
- **Pnpm_Script**: `apps_infra/package.json` 의 `scripts` 필드에 정의된 명령 (`build`, `lint`, `test`, `synth`, `diff`, `deploy:dev`, `destroy:dev`, `bootstrap`, `review`).
- **CDK_Synth**: `pnpm synth` 또는 `cdk synth` 실행. `cdk.out/` 에 CloudFormation 템플릿을 생성한다.
- **Deprecation_Warning**: CDK 가 stderr 로 출력하는 `Warning: ... is deprecated` 또는 `[WARNING]` 메시지.

## Requirements

### Requirement 1: 프로젝트 스캐폴딩 및 버전 매트릭스

**User Story:** As an infrastructure engineer, I want `apps_infra/` to be a self-contained single pnpm package with pinned tool versions, so that the project builds reproducibly without relying on the legacy monorepo layout. (design §1.3, §1.5, §2.1, §2.2, §2.3)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `cdk.json`, `cdk.context.json`, `jest.config.ts`, `.eslintrc.cjs`, `.prettierrc`, `.gitignore`, and `README.md` at its root.
2. THE `package.json` SHALL declare `"aws-cdk-lib": "2.252.0"`, `"aws-cdk": "2.1120.0"`, `"constructs": "^10.4.2"`, `"typescript": "^5.6.3"`, `"jest": "^29.7.0"`, `"ts-jest": "^29.2.5"`, and `"esbuild": "^0.24.0"`.
3. THE `package.json` SHALL declare `"engines": { "node": ">=20 <25", "pnpm": ">=9" }` and `"packageManager": "pnpm@9.12.0"`.
4. THE `package.json` SHALL NOT list any dependency whose name begins with `@aws-samples/`, `@infra/`, `@config/`, or equals `lerna`, `yarn`, `config`, `find-up`, `cdk-constants`, `http-method-enum`.
5. THE Apps_Infra_Project SHALL store every source, test, config, Lambda, stub, and spec file beneath `apps_infra/` such that no build or synth step reads a file located outside `apps_infra/`.
6. THE `tsconfig.json` SHALL set `strict: true`, `noImplicitAny: true`, `strictNullChecks: true`, and SHALL list `"include": ["bin/**/*.ts", "src/**/*.ts", "test/**/*.ts"]` while `"exclude"` contains `"lambda"`.
7. THE Apps_Infra_Project SHALL contain a `lambda/tsconfig.json` with `"noEmit": true` and `"types": ["node", "aws-lambda"]` for IDE type checking of the Lambda sources.
8. THE `cdk.context.json` SHALL be initialized to the literal content `{}` (empty object).
9. THE `cdk.json` SHALL set `"app": "npx ts-node --prefer-ts-exts bin/app.ts"` and include feature-flag context entries listed in design §2.3.
10. WHEN a developer runs `pnpm install` at the Apps_Infra_Project root, THE Apps_Infra_Project SHALL complete installation with exit code `0` and without peer-dependency errors.

### Requirement 2: Config Loader (YAML + Zod + dotenv)

**User Story:** As an operator, I want configuration to be loaded from a single `config/default.yml` file, validated with Zod, and overridable by environment variables, so that invalid configuration fails fast at synth time. (design §2.5, §2.14; decision D3)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/config/schema.ts`, `src/config/loader.ts`, and `src/config/index.ts`.
2. THE `src/config/schema.ts` SHALL export `RootConfigSchema`, `EnvSchema`, `InstanceOptionsSchema`, and `ParameterStoreKeysSchema` as Zod schemas matching design §2.5.
3. THE `EnvSchema` SHALL require `account` to match `/^\d{12}$/` and `region` to be a non-empty string.
4. THE `RootConfigSchema` SHALL require `namespace`, `administratorEmail` (email format), `mapBoxToken`, `instanceOptions`, and `parameterStoreKeys`, and SHALL default `assets.websiteBundlePath` to `"stub/website"`, `assets.distanceCacheDockerPath` to `"stub/opt-engine/distancecache-util"`, and `assets.optEngineDockerPath` to `"stub/opt-engine/nextday-delivery"`.
5. THE `ParameterStoreKeysSchema` SHALL reject any value that does not start with `"/"`.
6. WHEN `loadConfig` is invoked, THE Config_Loader SHALL read `config/default.yml` relative to `process.cwd()` and parse it with the `yaml` package.
7. WHEN `loadConfig` is invoked, THE Config_Loader SHALL call `dotenv.config` against `.env` with `override: false` before applying env-variable overrides.
8. WHEN the environment variable `CDK_DEFAULT_ACCOUNT` is set, THE Config_Loader SHALL override `raw.env.account` with that value before schema parsing.
9. WHEN the environment variable `CDK_DEFAULT_REGION` is set, THE Config_Loader SHALL override `raw.env.region` with that value before schema parsing.
10. WHEN the environment variable `MAPBOX_TOKEN` is set, THE Config_Loader SHALL override `raw.mapBoxToken` with that value before schema parsing.
11. WHEN the environment variable `ADMINISTRATOR_EMAIL` is set, THE Config_Loader SHALL override `raw.administratorEmail` with that value before schema parsing.
12. IF the loaded YAML violates any Zod constraint, THEN THE Config_Loader SHALL throw a `ZodError` and terminate the synth with a non-zero exit code.
13. THE `config/default.yml` SHALL preserve the top-level keys (`env`, `namespace`, `mapBoxToken`, `administratorEmail`, `administratorName`, `assets`, `instanceOptions`, `parameterStoreKeys`) documented in design §2.14.

### Requirement 3: Common Constructs (Namespace, NodejsFunction Factory, Policies)

**User Story:** As a CDK developer, I want shared helpers for resource naming, Lambda creation, and IAM policy statements, so that every stack produces consistently named and minimally permissioned resources. (design §2.7, §2.8, §2.9)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/constructs/common/namespace.ts` exporting `setNamespace`, `namespaced`, `namespacedBucket`, and `regionalNamespaced`.
2. WHEN `namespaced(scope, name)` is invoked and the namespace context key `"apps-infra:namespace"` is set on the enclosing stack, THE Namespace_Helper SHALL return the string `"${namespace}-${name}"`.
3. WHEN `namespacedBucket(scope, name)` is invoked, THE Namespace_Helper SHALL return the namespaced name lowercased.
4. WHEN `regionalNamespaced(scope, name)` is invoked, THE Namespace_Helper SHALL prefix the namespaced name with `"${Stack.of(scope).region}-"`.
5. THE Apps_Infra_Project SHALL contain `src/constructs/common/NodejsFn.ts` exporting `AppNodejsFunction` that extends `NodejsFunction`.
6. THE App_NodejsFunction SHALL resolve its `entry` by joining `path.resolve(process.cwd(), 'lambda')` with the `handlerPath` prop.
7. THE App_NodejsFunction SHALL apply `runtime: Runtime.NODEJS_24_X`, `memorySize: 256`, and `timeout: Duration.seconds(10)` unless the caller overrides them.
8. THE App_NodejsFunction SHALL set bundling defaults `target: 'node24'`, `minify: true`, `sourceMap: true`, and `externalModules: ['@aws-sdk/*']`, while allowing per-call overrides via the `bundling` prop.
9. THE Apps_Infra_Project SHALL contain `src/constructs/common/policies.ts` exporting `PolicyStatements` with members `ssm.readParams`, `s3.readBucket`, `s3.writeBucket`, `ddb.readDDBTable`, `ddb.updateDDBTable`, and `ddb.batchWriteDDBTable`, each returning an `iam.PolicyStatement` scoped to the provided resource ARNs.
10. THE `PolicyStatements.ddb.readDDBTable` SHALL include the resource `"${arn}/index/*"` in addition to the base table ARN.
11. THE Apps_Infra_Project SHALL NOT import `cdk-constants` or `http-method-enum`; THE CDK_App SHALL instead reference `iam.ServicePrincipal('ecs-tasks.amazonaws.com')` and `apigw.HTTPMethod` (or inline string constants) for the same purposes.

### Requirement 4: CDK App Entry Point and Stack Wiring

**User Story:** As a deployer, I want the CDK app entry point to instantiate all five stacks with explicit dependencies and namespace-prefixed stack names, so that `cdk synth` and `cdk deploy --all` behave deterministically. (design §1.4, §2.6)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `bin/app.ts` that creates a single `App` instance and calls `loadConfig()` at startup.
2. THE CDK_App SHALL instantiate exactly five stacks: Persistent_Stack (`Dev-PersistentBackend`), Backend_Stack (`Dev-Backend`), OrderUpload_Stack (`Dev-OrderUpload`), DistanceCache_Stack (`Dev-DistanceCache`), and OptEngine_Stack (`Dev-OptEngine`).
3. THE CDK_App SHALL set each stack's `stackName` to `"${namespace}-${LogicalName}"` where `LogicalName` is `PersistentBackend`, `Backend`, `OrderUpload`, `DistanceCache`, or `OptimizationEngine`.
4. THE CDK_App SHALL call `backend.addDependency(persistent)`, `orderUpload.addDependency(persistent)`, `distanceCache.addDependency(persistent)`, and `optEngine.addDependency(persistent)` exactly once each.
5. THE CDK_App SHALL pass `{ account: config.env.account, region: config.env.region }` as the `env` property to every stack.
6. THE CDK_App SHALL forward `persistent.vpc` as the `vpc` prop to DistanceCache_Stack and OptEngine_Stack.
7. WHEN `cdk synth` runs, THE CDK_App SHALL emit exactly five stacks to `cdk.out/` with filenames matching `"${namespace}-*.template.json"`.

### Requirement 5: Persistent Backend Stack

**User Story:** As an operator, I want a persistent stack to host VPC, data storage, identity, and website hosting resources whose removal policy is RETAIN, so that transient stacks can be torn down without losing state. (design §1.3, §1.4, §1.8 items 5/6/10)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/stacks/PersistentBackendStack.ts` exporting `PersistentBackendStack`.
2. THE Persistent_Stack SHALL compose four sub-components: `VpcPersistent`, `DataStorage` (NestedStack), `IdentityStack` (NestedStack), and `WebsiteHosting`.
3. THE Persistent_Stack SHALL expose `vpc: ec2.IVpc` as a public readonly member for downstream stacks.
4. THE `DataStorage` construct SHALL create DynamoDB tables for customer locations, warehouses, vehicles, orders, solver jobs, delivery jobs, and distance cache, and an S3 bucket for distance-cache exports.
5. THE `IdentityStack` construct SHALL create a `cognito.UserPool` with an explicit `passwordPolicy` to avoid the CDK 2.252 default-warning flag (design §1.8 item 10).
6. THE `WebsiteHosting` construct SHALL create a CloudFront distribution fronting an S3 bucket whose `encryption` is `s3.BucketEncryption.S3_MANAGED` (design §1.8 item 1).
7. THE Persistent_Stack SHALL publish a `CfnOutput` named `WebHostingDomain` whose `exportName` equals `"${namespace}-WebHostingDomain"` (design §1.8 item 6).
8. THE Persistent_Stack template SHALL contain at least 2 `AWS::S3::Bucket` resources, 7 `AWS::DynamoDB::Table` resources, and 1 `AWS::Cognito::UserPool` resource.

### Requirement 6: Backend Stack and ApiWeb

**User Story:** As an API consumer, I want the Backend stack to expose Cognito-protected REST endpoints backed by individual `NodejsFunction` Lambdas for each business entity, so that the frontend can call standard CRUD and query endpoints. (design §1.4, §1.6, §2.9 ApiWeb)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/stacks/BackendStack.ts` exporting `BackendStack`.
2. THE Backend_Stack SHALL instantiate a single `apigw.RestApi` whose `restApiName` equals `namespaced(this, 'WebApi')`.
3. THE Backend_Stack SHALL attach a `CognitoUserPoolsAuthorizer` bound to `Persistent_Stack.userPool` on every authenticated route.
4. THE Backend_Stack SHALL create `App_NodejsFunction` instances for the handler paths `api-web/customer-location-manager`, `api-web/warehouse-manager`, `api-web/vehicle-manager`, `api-web/orders-query`, `api-web/solver-job-query`, `api-web/delivery-jobs-query`, `api-web/delivery-job-by-solver-job-query`, `api-web/distance-cache-query`, `api-web/rebuild-distance-cache`, and `api-web/get-s3-presigned-url`.
5. THE Backend_Stack SHALL grant `grantReadWriteData` (or `grantReadData` for the read-only endpoints `delivery-job-by-solver-job-query` and `distance-cache-query`) on the corresponding DynamoDB tables to each Lambda.
6. THE Backend_Stack SHALL deploy Website_Stub contents to the CloudFront bucket via `s3-deployment.BucketDeployment` using `props.assets.websiteBundlePath` (default `"stub/website"`).
7. THE Backend_Stack SHALL generate an `AppVariables` JavaScript file (e.g. `/static/appvars.js`) containing at minimum the Cognito UserPool ID, UserPool Client ID, region, RestApi URL, and Mapbox token.
8. THE Backend_Stack SHALL depend on Persistent_Stack via `addDependency`.
9. THE Backend_Stack template SHALL contain exactly one `AWS::ApiGateway::RestApi` resource and at least 10 `AWS::Lambda::Function` resources owned by the stack (excluding CDK-generated custom-resource Lambdas).

### Requirement 7: OrderUpload Stack and ApiOrder

**User Story:** As an order-upload client, I want a dedicated API to request an S3 presigned URL, receive S3 event notifications, and trigger dispatch tasks, so that bulk order submission is decoupled from the main web API. (design §1.4, §1.6)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/stacks/OrderUploadStack.ts` exporting `OrderUploadStack`.
2. THE OrderUpload_Stack SHALL create an `s3.Bucket` whose `encryption` is `s3.BucketEncryption.S3_MANAGED` (design §1.8 item 1) and whose name is derived via `namespacedBucket(this, 'order-uploads')`.
3. THE OrderUpload_Stack SHALL create `App_NodejsFunction` instances for the handler paths `api-order/get-s3-presigned-url`, `api-order/create-order-batch`, and `api-order/start-order-dispatch-task`.
4. THE `create-order-batch` Lambda SHALL be configured as the target of an `s3.EventType.OBJECT_CREATED` notification on the upload bucket.
5. THE OrderUpload_Stack SHALL expose the `ApiOrder` RestApi (or HTTP API) with an API key requirement on the upload endpoint, matching the legacy behaviour of `apps/infra/OrderUploadStack`.
6. THE OrderUpload_Stack SHALL depend on Persistent_Stack via `addDependency`.
7. THE `get-s3-presigned-url` Lambda SHALL receive an `environment.BUCKET_NAME` variable resolved to the OrderUpload_Stack bucket name.

### Requirement 8: DistanceCache Stack

**User Story:** As an operator, I want a DistanceCache stack that hosts an ECS EC2 task built from the distancecache-util stub image, so that the cache-rebuild workflow can be invoked without the legacy monorepo build. (design §1.4, §1.7)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/stacks/DistanceCacheStack.ts` exporting `DistanceCacheStack`.
2. THE DistanceCache_Stack SHALL consume `props.vpc` (the Persistent_Stack VPC) rather than calling `ec2.Vpc.fromLookup`.
3. THE DistanceCache_Stack SHALL create an `EcsEc2Task` construct whose `dockerImagePath` defaults to `props.assets.distanceCacheDockerPath` (`"stub/opt-engine/distancecache-util"`).
4. THE `EcsEc2Task` construct SHALL expose `dockerImagePath`, `taskCommands`, `cpu`, `memoryMiB`, and `taskRole` as optional props that override the stub defaults (design §1.7).
5. THE DistanceCache_Stack SHALL register the distance-cache cluster name, capacity provider name, task-definition ARN, and container name as SSM Parameter Store entries using the `parameterStoreKeys` values.
6. THE DistanceCache_Stack SHALL launch the `AsgCapacityProvider` with `enableManagedScaling: true` (the CDK default) and with `desiredCapacity: 0` so the stub task is not continuously running.
7. THE DistanceCache_Stack SHALL attach `DockerImageAsset.platform` explicitly (design §1.8 item 7).

### Requirement 9: Optimization Engine Stack

**User Story:** As an operator, I want an Optimization Engine stack analogous to DistanceCache but pointing to the nextday-delivery stub image, so that the optimization workflow stack is present without requiring the Java build artifact. (design §1.4, §1.7)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `src/stacks/OptimizationEngineStack.ts` exporting `OptimizationEngineStack`.
2. THE OptEngine_Stack SHALL consume `props.vpc` from Persistent_Stack and SHALL NOT call `ec2.Vpc.fromLookup`.
3. THE OptEngine_Stack SHALL create an `EcsEc2Task` whose `dockerImagePath` defaults to `props.assets.optEngineDockerPath` (`"stub/opt-engine/nextday-delivery"`).
4. THE OptEngine_Stack SHALL register the opt-engine cluster name, capacity provider, task-definition ARN, and container name as SSM Parameter Store entries keyed by the corresponding `parameterStoreKeys` paths.
5. THE OptEngine_Stack SHALL depend on Persistent_Stack via `addDependency`.
6. THE OptEngine_Stack SHALL set `desiredCapacity: 0` on the EC2 capacity provider so the stub task does not run continuously.

### Requirement 10: Lambda Rewrite (NodejsFunction + AWS SDK v3)

**User Story:** As a Lambda developer, I want every business Lambda rewritten in TypeScript using `NodejsFunction` bundling and AWS SDK v3 clients, so that legacy `@infra/common/DeclaredLambdaFunction`, Lambda Layers, and SDK v2 can be removed. (decision D1, design §1.6, §2.10)

#### Acceptance Criteria

1. THE Lambda_Source_Root SHALL contain exactly the following handler entry files: `api-order/get-s3-presigned-url/index.ts`, `api-order/create-order-batch/index.ts`, `api-order/start-order-dispatch-task/index.ts`, `api-web/customer-location-manager/index.ts`, `api-web/warehouse-manager/index.ts`, `api-web/vehicle-manager/index.ts`, `api-web/orders-query/index.ts`, `api-web/solver-job-query/index.ts`, `api-web/delivery-jobs-query/index.ts`, `api-web/delivery-job-by-solver-job-query/index.ts`, `api-web/distance-cache-query/index.ts`, `api-web/rebuild-distance-cache/index.ts`, `api-web/get-s3-presigned-url/index.ts`.
2. THE `src/constants.ts` file SHALL export `LAMBDA_RUNTIME = Runtime.NODEJS_24_X`.
3. THE CDK_App SHALL create every business Lambda through App_NodejsFunction such that the synthesized `AWS::Lambda::Function` resources all have `Runtime = "nodejs24.x"`.
4. THE Lambda handlers SHALL import only from `@aws-sdk/*` (v3) for AWS client access; THE Lambda_Source_Root SHALL NOT contain imports from the `aws-sdk` v2 package.
5. THE Lambda handlers SHALL export `handler` typed as `APIGatewayProxyHandlerV2` (or the event-specific handler type for S3/EventBridge triggers).
6. THE CDK_App SHALL NOT define any `lambda.LayerVersion` for the business Lambdas; each Lambda SHALL bundle its dependencies via esbuild.
7. WHEN `cdk synth` runs, THE synthesized templates SHALL contain 0 `AWS::Lambda::LayerVersion` resources associated with business Lambda handler paths listed in acceptance criterion 1.
8. THE `lambda/_shared/` directory MAY contain reusable utilities (e.g., response formatter) that handler files import via relative paths.
9. THE Lambda handler files SHALL begin with the SPDX header `// SPDX-License-Identifier: MIT-0` (or equivalent comment form) preceded by the AWS copyright line (decision D10.3).

### Requirement 11: Stub Assets for Website and Opt-Engine

**User Story:** As a migration engineer, I want placeholder assets that satisfy CDK build/asset requirements for website and opt-engine images, so that `cdk synth` and `cdk deploy` succeed before the real `apps_web` and `apps_opt_engine` migrations are complete. (decision D2, design §1.7)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `stub/website/index.html` as a valid HTML5 document.
2. THE Apps_Infra_Project SHALL contain `stub/opt-engine/distancecache-util/Dockerfile` and `stub/opt-engine/nextday-delivery/Dockerfile`.
3. EACH stub Dockerfile SHALL use `FROM public.ecr.aws/nginx/nginx:stable-alpine` as the base image.
4. EACH stub Dockerfile SHALL define a `HEALTHCHECK` instruction that performs an HTTP probe against `http://localhost/`.
5. EACH stub Dockerfile SHALL declare `EXPOSE 80`.
6. WHEN the CDK_App synthesizes DistanceCache_Stack or OptEngine_Stack with default asset paths, THE CDK_App SHALL successfully produce a Docker image asset without requiring files outside `apps_infra/`.
7. THE stub asset paths SHALL be overridable via `Root_Config.assets.websiteBundlePath`, `Root_Config.assets.distanceCacheDockerPath`, and `Root_Config.assets.optEngineDockerPath`.

### Requirement 12: Testing Strategy (Jest 29 + ts-jest 29)

**User Story:** As a reviewer, I want automated tests that verify config schema correctness, stack resource composition, and Lambda runtime invariants, so that regressions are caught in CI before deploy. (decision D6, design §2.11)

#### Acceptance Criteria

1. THE Apps_Infra_Project SHALL contain `jest.config.ts` that sets `preset: 'ts-jest'`, `testEnvironment: 'node'`, and `testMatch: ['<rootDir>/test/**/*.spec.ts']`.
2. THE Apps_Infra_Project SHALL contain `test/config/schema.spec.ts` covering at minimum: a valid YAML sample, an invalid account (not 12 digits), a missing required field, an env-variable override, and default `assets.*` values.
3. THE Apps_Infra_Project SHALL contain one `test/stacks/*.spec.ts` file per stack (`PersistentBackendStack`, `BackendStack`, `OrderUploadStack`, `DistanceCacheStack`, `OptimizationEngineStack`).
4. EACH stack spec SHALL call `Template.fromStack(stack)` and assert resource counts for at least one CDK resource type specific to that stack.
5. THE stack specs SHALL assert `Template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({ Runtime: 'nodejs24.x' }))` for every stack that owns business Lambdas (Backend_Stack, OrderUpload_Stack, and Backend-adjacent constructs).
6. THE Persistent_Stack spec SHALL assert that every `CfnOutput` `exportName` starts with `"${namespace}-"`.
7. THE Apps_Infra_Project SHALL contain a smoke test that verifies `fs.existsSync(entry)` for every handler entry path listed in Requirement 10.1.
8. WHEN `pnpm test` runs, THE test runner SHALL exit with code `0` and SHALL NOT emit Jest deprecation warnings.

### Requirement 13: Build and Deploy Scripts (pnpm + CDK CLI)

**User Story:** As a developer, I want a fixed set of pnpm scripts that cover build, lint, test, synth, diff, deploy, destroy, bootstrap, and review, so that the workflow is reproducible without projen, nx, or Makefile. (decision D9, design §1.9, §2.1)

#### Acceptance Criteria

1. THE `package.json` `scripts` field SHALL define at least `build`, `watch`, `lint`, `format`, `format:write`, `test`, `test:watch`, `synth`, `diff`, `deploy:dev`, `destroy:dev`, `bootstrap`, `review`, and `prereview`.
2. THE `synth` script SHALL invoke `cdk synth` directly without projen or a wrapper script.
3. THE `deploy:dev` script SHALL invoke `cdk deploy --require-approval never --all`.
4. THE `review` script SHALL produce a `reports/cfn-nag-report.json` file (or equivalent) by running cfn-nag against the synthesized templates, and `prereview` SHALL run `pnpm synth` first.
5. WHEN `pnpm synth` runs in a clean checkout after `pnpm install`, THE command SHALL complete with exit code `0` and print zero `Deprecation_Warning` lines.
6. THE Apps_Infra_Project SHALL NOT contain `lerna.json`, `nx.json`, `projen.json`, `.projenrc.ts`, or any Makefile at its root.

### Requirement 14: CDK v2 Breaking-Change Checklist Compliance

**User Story:** As a reviewer, I want the migration to proactively address known CDK v2.59 → v2.252 breaking changes, so that stack synthesis produces no deprecation warnings and no export-name collisions. (decision D8, design §1.8)

#### Acceptance Criteria

1. EACH `s3.Bucket` created by the CDK_App SHALL explicitly set `encryption: s3.BucketEncryption.S3_MANAGED` (design §1.8 item 1).
2. EACH `BucketDeployment` created by the CDK_App SHALL either omit `runtime` (accepting the CDK-managed default) or set it to `LAMBDA_RUNTIME`; it SHALL NOT reference `Runtime.NODEJS_16_X` (design §1.8 item 2).
3. THE CDK_App SHALL NOT reference `Runtime.NODEJS_16_X`, `Runtime.NODEJS_18_X`, or `Runtime.NODEJS_22_X` for business Lambdas; only `Runtime.NODEJS_24_X` via `LAMBDA_RUNTIME` is permitted.
4. EVERY `CfnOutput` whose `exportName` is set SHALL use an export name prefixed with the namespace token (pattern `/^[A-Za-z0-9]+-[A-Za-z0-9-]+$/`) so that two deployments sharing a namespace collide deterministically and two deployments with different namespaces do not (design §1.8 item 6).
5. EVERY `DockerImageAsset` SHALL specify `platform` explicitly (design §1.8 item 7).
6. EVERY `ecs.AsgCapacityProvider` SHALL rely on the default `enableManagedScaling: true` and SHALL explicitly set `enableManagedTerminationProtection: false` (design §1.8 item 8).
7. EVERY `cognito.UserPool` SHALL specify a `passwordPolicy` explicitly (design §1.8 item 10).
8. THE `cdk.json` context SHALL include at minimum `@aws-cdk/core:newStyleStackSynthesis: true`, `@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy: true`, and `@aws-cdk/aws-iam:minimizePolicies: true` (design §1.8 item 11).

### Requirement 15: Phased Migration Checkpoints (S1–S10)

**User Story:** As a project lead, I want the migration broken into ten sequential checkpoints so that progress can be verified incrementally and rollback is localized. (decision D7, design §2.15)

#### Acceptance Criteria

1. THE migration SHALL be executed in the ordered stages S1 (Scaffolding), S2 (Config), S3 (Common constructs), S4 (Persistent), S5 (Backend), S6 (OrderUpload), S7 (DistanceCache), S8 (OptimizationEngine), S9 (E2E synth), S10 (Review) as listed in design §2.15.
2. THE S1 checkpoint SHALL be considered complete only when `pnpm install`, `pnpm build`, and `pnpm synth` succeed with exit code `0` against a placeholder `App` containing a single empty `PlaceholderStack` (required to bypass the CDK CLI ≥2.175 `This app contains no stacks` guardrail; the placeholder is removed in task 4.5).
3. THE S2 checkpoint SHALL be considered complete only when `test/config/schema.spec.ts` passes.
4. THE S3 checkpoint SHALL be considered complete only when unit tests for `namespaced`, `PolicyStatements`, and `AppNodejsFunction` all pass.
5. THE S4–S8 checkpoints SHALL each be considered complete only when the corresponding stack spec under `test/stacks/` passes.
6. THE S9 checkpoint SHALL be considered complete only when `pnpm synth` for all five stacks exits with code `0` and emits zero `Deprecation_Warning` lines on stderr.
7. THE S10 checkpoint SHALL be considered complete only when `pnpm review` produces `reports/cfn-nag-report.json`.

### Requirement 16: Non-Functional — Security, Maintainability, Reproducibility, Documentation

**User Story:** As a security-conscious operator, I want minimum-privilege IAM, encrypted storage, deterministic builds, and up-to-date project documentation, so that the migrated infra meets baseline production hygiene. (design §1.5, §2.12, §2.13, decisions D5, D10)

#### Acceptance Criteria

1. EVERY IAM policy attached by the CDK_App SHALL list explicit resource ARNs and SHALL NOT grant `"Resource": "*"` unless the service-level action requires wildcard resources (e.g., `ssm:GetParametersByPath` scoped to `arn:aws:ssm:${region}:${account}:parameter/*`).
2. EVERY business S3 bucket SHALL enforce `encryption: s3.BucketEncryption.S3_MANAGED` and `blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL` unless the bucket is a CloudFront-origin bucket that intentionally allows OAI-only access.
3. THE `src/constants.ts` SHALL be the single source of truth for `LAMBDA_RUNTIME`, `LAMBDA_DEFAULTS`, and `STACK_IDS`; other source files SHALL NOT redefine these names.
4. THE Apps_Infra_Project SHALL maintain SPDX license headers (`SPDX-License-Identifier: MIT-0` plus the AWS copyright line) on every `.ts` file under `bin/`, `src/`, `lambda/`, and `test/` (decision D10.3).
5. THE Apps_Infra_Project SHALL ship an `.eslintrc.cjs` based on `@typescript-eslint/recommended` + `prettier`, and SHALL NOT depend on any `@config/*` preset package (decision D10.4).
6. THE Apps_Infra_Project SHALL provide a `README.md` at its root that covers prerequisites (Node ≥20 <25, pnpm ≥9), install/build/test/deploy commands, stub-asset replacement guidance, and the config-file schema summary (decision D10.5).
7. THE `cdk.context.json` SHALL be committed as `{}` (empty object) at every tagged release to guarantee reproducible synthesis on fresh clones (decision D5, design §2.4).
8. EVERY business DynamoDB table SHALL enable `pointInTimeRecovery` or `pointInTimeRecoverySpecification.pointInTimeRecoveryEnabled: true` if the original `@infra/data-storage` construct enabled it; otherwise the migration SHALL preserve the legacy setting verbatim to avoid silent downgrades.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

> Note: The full EARS → Property prework will be authored in `design.md` during the "Update Correctness Properties" phase via the `prework` tool. The properties below are an initial set seeded from the requirements to anchor the subsequent mapping step.

### Property 1: Config schema round-trip validity

*For any* `Root_Config` object produced by `loadConfig`, serializing it back to YAML and re-parsing through `RootConfigSchema` SHALL produce an equivalent object.

**Validates: Requirements 2.2, 2.4, 2.5, 2.6**

### Property 2: Config schema rejects invalid inputs

*For any* YAML document whose `env.account` does not match `/^\d{12}$/`, or whose `parameterStoreKeys` contains a value not starting with `/`, `RootConfigSchema.parse` SHALL throw a `ZodError`.

**Validates: Requirements 2.3, 2.5, 2.12**

### Property 3: Stack set resource-count invariant

*For any* valid `Root_Config`, synthesizing the CDK_App SHALL produce exactly five CloudFormation templates whose logical stack names are `${namespace}-{PersistentBackend,Backend,OrderUpload,DistanceCache,OptimizationEngine}`.

**Validates: Requirements 4.2, 4.3, 4.7**

### Property 4: Lambda runtime invariant

*For every* `AWS::Lambda::Function` resource owned by a business handler path listed in Requirement 10.1 across all synthesized templates, the `Runtime` property SHALL equal `"nodejs24.x"`.

**Validates: Requirements 10.2, 10.3, 12.5, 14.3**

### Property 5: CfnOutput exportName namespace rule

*For every* `CfnOutput` whose `exportName` is set in any synthesized template, the export name SHALL begin with `"${Root_Config.namespace}-"`.

**Validates: Requirements 5.7, 12.6, 14.4**

### Property 6: Stack dependency acyclicity

*For any* pair of stacks `(A, B)` among Stack_Set where `B ∈ {Backend, OrderUpload, DistanceCache, OptEngine}` and `A = Persistent`, the synthesized `cdk.out/manifest.json` SHALL declare `B` depending on `A` and SHALL NOT declare any cycle.

**Validates: Requirements 4.4, 6.8, 7.6, 9.5**

### Property 7: Handler entry file existence

*For every* handler path `p` passed to `AppNodejsFunction`, `fs.existsSync(path.resolve(process.cwd(), 'lambda', p))` SHALL return `true` at synth time.

**Validates: Requirements 3.6, 10.1, 12.7**

### Property 8: S3 encryption invariant

*For every* `AWS::S3::Bucket` resource created by the CDK_App, the `BucketEncryption.ServerSideEncryptionConfiguration[*].ServerSideEncryptionByDefault.SSEAlgorithm` SHALL equal `"AES256"`.

**Validates: Requirements 5.6, 7.2, 14.1, 16.2**

### Property 9: No forbidden dependencies

*For any* `package.json` of the Apps_Infra_Project, the `dependencies` and `devDependencies` keys SHALL contain no entry whose name matches the regex `^(@aws-samples/|@infra/|@config/|lerna$|config$|find-up$|cdk-constants$|http-method-enum$)`.

**Validates: Requirements 1.4, 3.11**

### Property 10: Zero deprecation warnings on synth

*For any* clean checkout, executing `pnpm install && pnpm synth` SHALL complete with exit code `0` and SHALL emit zero lines matching `/(?i)deprecat/` on stderr.

**Validates: Requirements 13.5, 14.2, 14.3, 15.6**

### Requirement 17: Lambda API 응답 호환성 (REST API V1 + CORS + 프론트엔드 응답 형식)

**User Story:** As a frontend developer, I want Lambda handlers to return responses compatible with API Gateway REST API (V1) and include proper CORS headers, so that the React frontend can successfully call the API without cross-origin errors or data parsing failures.

#### Acceptance Criteria

1. THE Lambda handlers SHALL use `APIGatewayProxyHandler` type (V1) instead of `APIGatewayProxyHandlerV2` (V2), because the CDK app creates `apigw.RestApi` (REST API V1) not HTTP API V2.
2. THE Lambda handlers SHALL access the HTTP method via `event.httpMethod` (V1 format) and NOT via `event.requestContext.http.method` (V2 format).
3. THE `lambda/_shared/response.ts` `json()` helper SHALL include CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`) in every response, so that even error responses (4xx/5xx) include CORS headers and do not trigger browser CORS errors.
4. THE Lambda handlers for list endpoints (GET without ID) SHALL return responses in the format `{ data: { Items: [...] } }` to match the frontend `crudService.ts` expectation of destructuring `response.data.Items`.
5. THE Lambda handlers for single-item endpoints (GET with ID) SHALL return responses in the format `{ data: { Item: {...} } }` to match the frontend `crudService.ts` expectation of destructuring `response.data.Item`.
6. THE Lambda handlers for create/update endpoints (POST/PUT) SHALL return responses in the format `{ data: { Item: {...} } }`.
7. THE `rebuild-distance-cache` Lambda endpoint SHALL be registered at path `api/web/build-dist-cache/{warehouseCode}` with GET method, matching the frontend's `NextDayDelivery.ts` call to `GET /build-dist-cache/{warehouseCode}`.
8. THE `rebuild-distance-cache` Lambda handler SHALL extract `warehouseCode` from `event.pathParameters?.warehouseCode` and pass it as the `WAREHOUSE_CODE` environment variable to the ECS RunTask container override.

### Property 11: REST API V1 handler compatibility

*For every* Lambda handler connected to `apigw.RestApi`, the handler type SHALL be `APIGatewayProxyHandler` (not V2) and SHALL access HTTP method via `event.httpMethod`.

**Validates: Requirements 17.1, 17.2**

### Property 12: CORS headers in all responses

*For every* response returned by the `json()` helper in `lambda/_shared/response.ts`, the response headers SHALL include `Access-Control-Allow-Origin: *`.

**Validates: Requirements 17.3**

### Property 13: Frontend-compatible response format

*For every* list endpoint (GET without path parameter), the response body SHALL contain a top-level `data` object with an `Items` array. *For every* single-item endpoint, the response body SHALL contain a top-level `data` object with an `Item` object.

**Validates: Requirements 17.4, 17.5, 17.6**

### Requirement 18: Fargate 전환 및 ECS RunTask 호환성

**User Story:** As an operator, I want ECS tasks to run on Fargate with proper network configuration and correct cluster targeting, so that distance cache rebuild and order dispatch tasks execute successfully without EC2 instance management.

#### Acceptance Criteria

1. THE `config/default.yml` SHALL define `fargateOptions` (replacing `instanceOptions`) with `distCacheCpu`, `distCacheMemory`, `distCacheArchitecture`, `optEngineCpu`, `optEngineMemory`, `optEngineArchitecture` fields.
2. THE ECS RunTask Lambda handlers (`rebuild-distance-cache`, `start-order-dispatch-task`) SHALL use `launchType: 'FARGATE'` with `networkConfiguration.awsvpcConfiguration` instead of `capacityProviderStrategy`.
3. THE ECS RunTask Lambda handlers SHALL retrieve VPC private subnets via `ec2:DescribeSubnets` using the VPC ID from SSM parameter, and pass them in `awsvpcConfiguration.subnets`.
4. THE `start-order-dispatch-task` Lambda SHALL target the **OptimizationEngine** cluster (SSM keys: `optEngineClusterName`, `optEngineContainerName`, `optEngineTaskDefArn`) and NOT the DistanceCache cluster.
5. THE `start-order-dispatch-task` Lambda SHALL pass `ORDER_DATE` and `WAREHOUSE_CODE` as container override environment variables, extracted from the request body.
6. THE `rebuild-distance-cache` Lambda SHALL target the **DistanceCache** cluster and pass `BUCKET_NAME`, `LOCATION_TABLE`, `CACHE_TABLE`, `WAREHOUSE_CODE` as container override environment variables.
7. THE Lambda execution roles for RunTask handlers SHALL include `ec2:DescribeSubnets` permission.
8. THE `DistanceCacheStack` and `OptimizationEngineStack` SHALL NOT specify `taskCommands` in the `EcsFargateTask` construct, deferring to the Dockerfile's `CMD` instruction.

### Requirement 19: Dockerfile 환경변수 치환 및 CLI 호환성

**User Story:** As a container developer, I want Dockerfiles to use shell form for CMD so that environment variables are properly expanded at runtime, and CLI arguments match the actual jar's expected parameters.

#### Acceptance Criteria

1. THE `distancecache-util/Dockerfile` SHALL use `ENTRYPOINT ["/bin/sh", "-c"]` with `CMD ["java -jar ... $ENV_VAR"]` pattern so that environment variables are expanded by the shell at runtime.
2. THE `nextday-delivery/Dockerfile` SHALL use the same `ENTRYPOINT`/`CMD` pattern for environment variable expansion.
3. THE `distancecache-util/Dockerfile` CMD SHALL reference the correct jar filename (`distance-cache-util.jar`) and use CLI options matching the jar's picocli interface (`--loctablename`, `--tablename`, `--bucketname`, `--warehouse`, `-p=s3`).
4. THE `nextday-delivery/Dockerfile` CMD SHALL reference the correct jar filename (`delivery-dispatch.jar`) and pass `-Dorder-date=$ORDER_DATE -Dwarehouse-code=$WAREHOUSE_CODE` as JVM system properties.

### Requirement 20: Order Upload 파이프라인 (CSV 파싱 + SSM 파라미터 등록)

**User Story:** As an order upload client, I want the upload pipeline to handle CSV files and expose API endpoint information via SSM, so that the upload script and S3 event processing work end-to-end.

#### Acceptance Criteria

1. THE `create-order-batch` Lambda SHALL support both JSON and CSV file formats, auto-detecting based on file content (JSON starts with `[` or `{`, otherwise CSV).
2. THE `create-order-batch` Lambda SHALL parse CSV by treating the first line as headers and subsequent lines as data rows, producing an array of objects with header-keyed properties.
3. THE `OrderUploadStack` SHALL register the REST API URL and API Key ID as SSM parameters at paths defined by `parameterStoreKeys.orderUploadApiUrl` and `parameterStoreKeys.orderUploadApiKey`.
4. THE `upload-order-with-presigned-url.sh` script SHALL retrieve the API Key value via `aws apigateway get-api-key --include-value` using the Key ID stored in SSM.
5. THE `upload-order-with-presigned-url.sh` script SHALL use PUT method with the presigned URL (not POST form upload) to upload the order file to S3.
