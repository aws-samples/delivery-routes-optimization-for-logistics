# apps_infra

Delivery routes optimization — AWS CDK infrastructure.

Migrated from `delivery-routes-optimization-for-logistics/apps/infra` (lerna + yarn-workspaces monorepo with 8 `@infra/*` packages) into a single self-contained pnpm package using AWS CDK 2.252, TypeScript 5.6, and Node.js 24 Lambda runtime.

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | `>=20 <25` |
| pnpm | `>=9` |
| AWS CDK CLI | `2.1120.0` (installed as devDependency) |
| Docker | Required for `cdk synth` / `cdk deploy` (ECS image assets) |

Optional:
- `cfn_nag_scan` (Ruby gem) — for security review via `pnpm review`

## Getting Started

```bash
# Install dependencies
pnpm install

# Build (TypeScript type-check only — Lambda bundling happens at synth time)
pnpm build

# Run tests
pnpm test

# Synthesize CloudFormation templates
pnpm synth

# Deploy all stacks to dev environment
pnpm deploy:dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | TypeScript compilation (`tsc`) for `src/` and `bin/` |
| `pnpm watch` | TypeScript watch mode |
| `pnpm lint` | ESLint check |
| `pnpm format` | Prettier check |
| `pnpm format:write` | Prettier auto-fix |
| `pnpm test` | Run Jest test suite |
| `pnpm test:watch` | Jest watch mode |
| `pnpm synth` | CDK synthesize all stacks to `cdk.out/` |
| `pnpm diff` | CDK diff against deployed stacks |
| `pnpm deploy:dev` | Deploy all stacks (`--require-approval never`) |
| `pnpm destroy:dev` | Destroy all stacks |
| `pnpm bootstrap` | CDK bootstrap the target account/region |
| `pnpm review` | Run cfn-nag security scan (requires `cfn_nag_scan`) |

## Stack Architecture

The CDK app produces 5 CloudFormation stacks with the following dependency graph:

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
                  All depend on PersistentBackendStack
```

## Configuration

Configuration is loaded from `config/default.yml`, validated with Zod, and overridable via environment variables.

### `config/default.yml` Schema

| Key | Type | Description |
|-----|------|-------------|
| `env.account` | string (12 digits) | AWS account ID |
| `env.region` | string | AWS region |
| `namespace` | string | Resource name prefix (e.g. `devproto`) |
| `administratorEmail` | string (email) | Admin user email for Cognito |
| `administratorName` | string (default: `Administrator`) | Admin display name |
| `instanceOptions.distCacheInstanceType` | string | EC2 instance type for distance cache |
| `instanceOptions.distCacheHardwareType` | `arm64` \| `x86_64` | Architecture for distance cache |
| `instanceOptions.optEngineInstanceType` | string | EC2 instance type for opt engine |
| `instanceOptions.optEngineHardwareType` | `arm64` \| `x86_64` | Architecture for opt engine |
| `parameterStoreKeys` | Record<string, string> | SSM parameter paths (values must start with `/`) |
| `assets.websiteBundlePath` | string (required) | Path to the built web bundle (e.g. `../apps_web/dist`) |
| `assets.distanceCacheDockerPath` | string (required) | Docker build context for the distance-cache ECS task (e.g. `../apps_opt_engine/build/distancecache-util`) |
| `assets.optEngineDockerPath` | string (required) | Docker build context for the opt-engine ECS task (e.g. `../apps_opt_engine/build/nextday-delivery`) |

### Environment Variable Overrides

| Variable | Overrides |
|----------|-----------|
| `CDK_DEFAULT_ACCOUNT` | `env.account` |
| `CDK_DEFAULT_REGION` | `env.region` |
| `ADMINISTRATOR_EMAIL` | `administratorEmail` |

You can also place a `.env` file at the project root (loaded via dotenv with `override: false`).

## Asset Paths

The three `assets` fields in `config/default.yml` are **required** and must point at directories that contain real build artifacts. At CDK synth time, `s3deploy.Source.asset()` and `ecs.ContainerImage.fromAsset()` stage those paths into the asset bundle.

| Key | Must contain | Produced by |
|---|---|---|
| `assets.websiteBundlePath` | `index.html` and static assets | `cd apps_web && pnpm install && pnpm build` → `apps_web/dist/` |
| `assets.distanceCacheDockerPath` | `Dockerfile` (+ jar, OSM PBF, …) | `cd apps_opt_engine && ./build_opt_engine.sh` → `apps_opt_engine/build/distancecache-util/` |
| `assets.optEngineDockerPath` | `Dockerfile` (+ jar, solver-config, OSM PBF) | `cd apps_opt_engine && ./build_opt_engine.sh` → `apps_opt_engine/build/nextday-delivery/` |

The default `config/default.yml` already points at those relative paths (`../apps_web/dist`, `../apps_opt_engine/build/...`). Build the workspaces first, then run `pnpm synth` / `pnpm deploy:dev`. If the build artifacts are missing, synth fails with a "path not found" error.

## Project Structure

```
apps_infra/
├── bin/app.ts              # CDK app entry point
├── src/
│   ├── config/             # Zod schema + YAML loader
│   ├── constants.ts        # LAMBDA_RUNTIME, LAMBDA_DEFAULTS, STACK_IDS
│   ├── constructs/         # Reusable CDK constructs
│   │   ├── common/         # Namespace, AppNodejsFunction, PolicyStatements
│   │   ├── networking/     # VpcPersistent
│   │   ├── data-storage/   # DataStorage (NestedStack)
│   │   ├── cognito-auth/   # IdentityStack (NestedStack)
│   │   ├── web-hosting/    # WebsiteHosting, HostingDeployment, AppVariables
│   │   ├── api-web/        # ApiWeb (10 Lambda endpoints)
│   │   ├── api-order/      # ApiOrder (3 Lambda endpoints)
│   │   └── ecs-task/       # EcsEc2Task
│   └── stacks/             # 5 CDK stacks
├── lambda/                 # Lambda handler source (bundled by esbuild at synth)
│   ├── _shared/            # Common utilities
│   ├── api-web/            # 10 web API handlers
│   └── api-order/          # 3 order API handlers
├── config/default.yml      # Default configuration
├── test/                   # Jest test suite
└── cdk.out/                # Synthesized CloudFormation (gitignored)
```

## License

MIT-0
