# apps_infra

배송 경로 최적화 프로젝트 — AWS CDK 인프라.

AWS CDK 2.252 + TypeScript 5.6 + Node.js 24 Lambda 런타임 기반의 **단일 pnpm 패키지** 로 구성되어 있습니다.

## 사전 요건

| 도구 | 버전 |
|------|---------|
| Node.js | `>=20 <25` |
| pnpm | `>=9` |
| AWS CDK CLI | `2.1120.0` (devDependency 로 포함) |
| Docker | `cdk synth` / `cdk deploy` 시 ECS 이미지 자산 빌드에 필요 |

선택:
- `cfn_nag_scan` (Ruby gem) — `pnpm review` 로 보안 리뷰 수행

## 시작하기

```bash
# 의존성 설치
pnpm install

# 빌드 (TypeScript 타입 체크만 — Lambda 번들링은 synth 시점에 수행)
pnpm build

# 테스트 실행
pnpm test

# CloudFormation 템플릿 synthesize
pnpm synth

# 모든 스택을 dev 환경에 배포
pnpm deploy:dev
```

## 주요 스크립트

| 스크립트 | 설명 |
|--------|-------------|
| `pnpm build` | `src/`, `bin/` TypeScript 컴파일 (`tsc`) |
| `pnpm watch` | TypeScript watch 모드 |
| `pnpm lint` | ESLint 검사 |
| `pnpm format` | Prettier 검사 |
| `pnpm format:write` | Prettier 자동 포맷 |
| `pnpm test` | Jest 테스트 실행 |
| `pnpm test:watch` | Jest watch 모드 |
| `pnpm synth` | CDK 모든 스택을 `cdk.out/` 로 synthesize |
| `pnpm diff` | 배포된 스택 대비 CDK diff |
| `pnpm deploy:dev` | 모든 스택 배포 (`--require-approval never`) |
| `pnpm destroy:dev` | 모든 스택 삭제 |
| `pnpm bootstrap` | 대상 계정/리전에 CDK bootstrap |
| `pnpm review` | cfn-nag 보안 스캔 실행 (`cfn_nag_scan` 필요) |

## 스택 구성

CDK 앱은 아래 의존 그래프를 갖는 5개의 CloudFormation 스택을 생성합니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                    PersistentBackendStack                        │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────┐ │
│  │ VpcPersistent│ │ DataStorage  │ │IdentityStk│ │WebHosting│ │
│  │ (VPC, NAT)   │ │ (7 DDB + S3) │ │(Cognito)   │ │(CF + S3) │ │
│  └──────────────┘ └──────────────┘ └────────────┘ └──────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                             │ addDependency
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌────────────────┐ ┌─────────────────────────┐
│  BackendStack   │ │OrderUploadStack│ │  DistanceCacheStack     │
│  - ApiWeb (10λ) │ │ - ApiOrder (3λ)│ │  - EcsEc2Task           │
│  - BucketDeploy │ │ - S3 uploads   │ │  - distancecache-util    │
│  - AppVariables │ │ - API Key      │ │                         │
└─────────────────┘ └────────────────┘ └─────────────────────────┘
         │                                       │
         │           ┌──────────────────────────┐│
         │           │ OptimizationEngineStack   ││
         │           │ - EcsEc2Task             ││
         │           │ - nextday-delivery       ││
         │           └──────────────────────────┘│
         │                       ▲               │
         │                       │               │
         └───────────────────────┘───────────────┘
              모두 PersistentBackendStack 에 의존
```

## 설정

설정은 `config/default.yml` 에서 로드되고 Zod 로 검증되며, 환경변수로 override 가능합니다.

### `config/default.yml` 스키마

| 키 | 타입 | 설명 |
|-----|------|-------------|
| `env.account` | string (12자리) | AWS 계정 ID |
| `env.region` | string | AWS 리전 |
| `namespace` | string | 리소스 이름 prefix (예: `devproto`) |
| `administratorEmail` | string (email) | Cognito 관리자 이메일 |
| `administratorName` | string (기본값: `Administrator`) | 관리자 표시 이름 |
| `instanceOptions.distCacheInstanceType` | string | distance-cache 용 EC2 인스턴스 타입 |
| `instanceOptions.distCacheHardwareType` | `arm64` \| `x86_64` | distance-cache 아키텍처 |
| `instanceOptions.optEngineInstanceType` | string | opt-engine 용 EC2 인스턴스 타입 |
| `instanceOptions.optEngineHardwareType` | `arm64` \| `x86_64` | opt-engine 아키텍처 |
| `parameterStoreKeys` | Record<string, string> | SSM 파라미터 경로 (값은 `/` 로 시작) |
| `assets.websiteBundlePath` | string (필수) | 빌드된 웹 번들 경로 (예: `../apps_web/dist`) |
| `assets.distanceCacheDockerPath` | string (필수) | distance-cache ECS 태스크용 Docker 빌드 컨텍스트 (예: `../apps_opt_engine/build/distancecache-util`) |
| `assets.optEngineDockerPath` | string (필수) | opt-engine ECS 태스크용 Docker 빌드 컨텍스트 (예: `../apps_opt_engine/build/nextday-delivery`) |

### 환경변수 Override

| 환경변수 | Override 대상 |
|----------|-----------|
| `CDK_DEFAULT_ACCOUNT` | `env.account` |
| `CDK_DEFAULT_REGION` | `env.region` |
| `ADMINISTRATOR_EMAIL` | `administratorEmail` |

프로젝트 루트에 `.env` 파일을 두면 dotenv 로 로드됩니다 (`override: false`).

## 자산(Asset) 경로

`config/default.yml` 의 `assets` 세 필드는 **필수** 이며, 실제 빌드 산출물이 존재하는 디렉터리를 가리켜야 합니다. CDK synth 시점에 `s3deploy.Source.asset()` 와 `ecs.ContainerImage.fromAsset()` 가 이 경로들을 스테이징 합니다.

| 키 | 포함해야 할 것 | 만드는 명령 |
|---|---|---|
| `assets.websiteBundlePath` | `index.html` 과 정적 자산 | `cd apps_web && pnpm install && pnpm build` → `apps_web/dist/` |
| `assets.distanceCacheDockerPath` | `Dockerfile` (+ jar, OSM PBF 등) | `cd apps_opt_engine && ./build_opt_engine.sh` → `apps_opt_engine/build/distancecache-util/` |
| `assets.optEngineDockerPath` | `Dockerfile` (+ jar, solver-config, OSM PBF) | `cd apps_opt_engine && ./build_opt_engine.sh` → `apps_opt_engine/build/nextday-delivery/` |

기본 `config/default.yml` 값은 이미 위 상대 경로들(`../apps_web/dist`, `../apps_opt_engine/build/...`) 을 가리키므로, 빌드를 먼저 수행한 뒤 `pnpm synth` / `pnpm deploy:dev` 를 실행하면 됩니다. 빌드 산출물이 없으면 synth 단계에서 "path not found" 에러로 실패합니다.

## 프로젝트 구조

```
apps_infra/
├── bin/app.ts              # CDK 앱 엔트리 포인트
├── src/
│   ├── config/             # Zod 스키마 + YAML 로더
│   ├── constants.ts        # LAMBDA_RUNTIME, LAMBDA_DEFAULTS, STACK_IDS
│   ├── constructs/         # 재사용 가능한 CDK 컨스트럭트
│   │   ├── common/         # Namespace, AppNodejsFunction, PolicyStatements
│   │   ├── networking/     # VpcPersistent
│   │   ├── data-storage/   # DataStorage (NestedStack)
│   │   ├── cognito-auth/   # IdentityStack (NestedStack)
│   │   ├── web-hosting/    # WebsiteHosting, HostingDeployment, AppVariables
│   │   ├── api-web/        # ApiWeb (10 Lambda endpoint)
│   │   ├── api-order/      # ApiOrder (3 Lambda endpoint)
│   │   └── ecs-task/       # EcsEc2Task
│   └── stacks/             # 5개 CDK 스택
├── lambda/                 # Lambda 핸들러 소스 (synth 시점에 esbuild 로 번들링)
│   ├── _shared/            # 공통 유틸
│   ├── api-web/            # 10개 web API 핸들러
│   └── api-order/          # 3개 order API 핸들러
├── config/default.yml      # 기본 설정
├── test/                   # Jest 테스트
└── cdk.out/                # synthesize 결과 (gitignore)
```

## 라이선스

MIT-0
