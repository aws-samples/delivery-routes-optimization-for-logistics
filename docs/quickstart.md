# Quickstart Guide

This guide walks through everything you need to build the project locally and deploy it to an AWS account.

---

## 1. Requirements

The following tools and versions are required to build and deploy the project.

### 1.1 Dev Tools

| Item | Version / Notes |
|---|---|
| **JDK** | **21** (Amazon Corretto 21 or Temurin 21 recommended) — used by `apps_opt_engine` |
| **Node.js** | **`>=20.19 <25`** — used by `apps_web` and `apps_infra` |
| **pnpm** | **`>=9`** (recommended: `pnpm@9.12.0`) |
| **Gradle Wrapper** | Bundled (`./gradlew`) — no separate install is needed once JDK 21 is available |
| **Docker** | Required by `cdk synth` / `cdk deploy` for ECS image assets |
| **AWS CLI** | **v2** ([install guide](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)) |
| **git**, **bash**, **zip**, **jq** | Required by the shell scripts |

### 1.2 Tech Stack Versions

| Layer | Stack |
|---|---|
| **Optimization Engine** (`apps_opt_engine`) | Java 21 · Spring Boot 3.5.14 · OptaPlanner 10.2.0 · GraphHopper 11.0 · AWS SDK v2 (2.42.x) · Gradle 8.x (Kotlin DSL, multi-module) |
| **Web App** (`apps_web`) | React 19 · Vite 7 · TypeScript 5.7 · Cloudscape Design · AWS Amplify 6 · MapLibre GL · react-map-gl 8 |
| **Infrastructure** (`apps_infra`) | AWS CDK 2.252 · TypeScript 5.6 · Node 20~24 Lambda runtime · cfn-nag (optional) |

### 1.3 AWS Account

- An **AWS account** with enough permissions to deploy the application ([create an account](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/)).

---

## 2. Deployment

### 2.1 AWS Credential Setup

CDK uses whatever AWS credentials are present in your shell environment. Pick one of the two options below.

**Option A. `AWS_PROFILE` environment variable (recommended)**

If a named profile is already configured in `~/.aws/credentials` / `~/.aws/config`, just export its name.

```bash
export AWS_PROFILE=my-deployment-profile
export AWS_REGION=us-east-1
```

**Option B. `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` directly**

```bash
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...        # only for temporary credentials (STS / SSO)
export AWS_REGION=us-east-1
```

Verify the credentials are picked up correctly:

```bash
aws sts get-caller-identity
```

### 2.2 Build and Deploy Order

> **Order matters.** The CDK stacks in `apps_infra` consume `apps_web/dist` and `apps_opt_engine/build/{distancecache-util,nextday-delivery}` as ECS / web-hosting assets. Build them first, in the order **Optimization Engine → Web → Infra**.

#### Step 1. Build the Optimization Engine

```bash
cd apps_opt_engine
./build_opt_engine.sh
```

The script performs the following steps:

- **JDK 21 resolution** — auto-detected on macOS via `/usr/libexec/java_home -v 21`; on Linux / CI it uses `JAVA_HOME` (or `java` on PATH) and verifies the major version is 21.
- **OSM PBF preparation** — if `$HOME/.graphhopper/openstreetmap/south-korea-latest.osm.pbf` is missing, it is auto-downloaded from [Geofabrik](https://download.geofabrik.de/asia/south-korea.html); otherwise the existing file is reused.
- `./gradlew clean :apps:nextday-delivery:bootJar :apps:distancecache-util:shadowJar`
- Packages artifacts:
  - `build/distancecache-util/` — distance-cache CLI jar + `Dockerfile` + OSM PBF
  - `build/nextday-delivery/` — optimization-engine jar + `solver-config.xml` + `Dockerfile` + OSM PBF

> On Linux / CI, install JDK 21 and export `JAVA_HOME`. Example: `export JAVA_HOME=/usr/lib/jvm/java-21-openjdk`.
> The OSM path and URL can be overridden with the `OSM_FILE` and `OSM_URL` environment variables.

#### Step 2. Build the Web App

```bash
cd apps_web
pnpm install
pnpm build
```

The build output is written to `apps_web/dist/`, which `apps_infra` then consumes as the CloudFront + S3 web-hosting asset.

#### Step 3. Configure Infrastructure

Open `apps_infra/config/default.yml` and adjust the values for your environment.

```yaml
env:
  account: '025066253622'          # ← your 12-digit AWS account ID
  region: us-east-1                # ← target region

namespace: devproto                # ← resource namespace (lowercase letters / digits recommended)

administratorEmail: your-email@example.com   # ← email that receives the Cognito temporary password
administratorName: Administrator

assets:
  websiteBundlePath: ../apps_web/dist
  distanceCacheDockerPath: ../apps_opt_engine/build/distancecache-util
  optEngineDockerPath: ../apps_opt_engine/build/nextday-delivery
```

> You can also override via environment variables: `CDK_DEFAULT_ACCOUNT`, `CDK_DEFAULT_REGION`, `ADMINISTRATOR_EMAIL`.

#### Step 4. Deploy the Infrastructure

```bash
cd apps_infra
pnpm install
pnpm bootstrap       # one-time only per account/region (CDK bootstrap)
pnpm deploy:dev      # deploys all stacks (--require-approval never --all)
```

`pnpm deploy:dev` creates 5 CloudFormation stacks in order:

1. `PersistentBackendStack` — VPC / DynamoDB (7 tables) / S3 / Cognito / CloudFront
2. `BackendStack` — ApiWeb (10 Lambdas) / website deployment / `appvars.js` generation
3. `OrderUploadStack` — Order Upload API (3 Lambdas) / S3 / API Key
4. `DistanceCacheStack` — Distance Cache ECS EC2 Task
5. `OptimizationEngineStack` — Nextday Delivery ECS EC2 Task

When deployment finishes, the Cognito temporary administrator password is sent to `administratorEmail`, and the CloudFront URL can be found in the deploy output.

### 2.3 Verify the Deployment

```bash
# confirm all stacks reached CREATE_COMPLETE / UPDATE_COMPLETE
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# preview upcoming changes
cd apps_infra && pnpm diff
```

You can also open the web UI via `apps_infra/scripts/open-demo-webui.sh`.

---

## 3. Run Demo

Once the environment is deployed, walk through the following steps to upload the sample order and run the optimizer. All scripts respect the `AWS_PROFILE` / `AWS_REGION` environment variables, so no extra setup is needed if §2.1 is already in place.

### 3.1 Upload Master Data

```bash
cd apps_infra
./scripts/upload-master-data.sh
```

The script reads DynamoDB table names from SSM Parameter Store and `put-item`s sample Warehouse / Customer Location / Vehicle records. The uploaded data becomes immediately visible under the corresponding menus in the web UI.

### 3.2 Open the Web UI and Create an Account

```bash
./scripts/open-demo-webui.sh
```

- Your browser opens the CloudFront domain.
- Sign in with the administrator account using the temporary password received by email, then set a new password when prompted.
- Confirm the master data is visible under the **Customer Location / Warehouse / Vehicle** menus.

### 3.3 Build the Distance Cache

A precomputed road-based distance matrix keeps solver runs fast.

1. Navigate to the **Distance Cache** menu in the web UI.
2. Click **Rebuild Distance Cache**.
3. Enter warehouse code `95001200`, then click **ReBuild**.
4. Wait until the ECS Task finishes (a few minutes).

### 3.4 Upload Orders and Run the Optimizer

```bash
./scripts/upload-order-with-presigned-url.sh
```

- The script fetches a presigned URL from the Order Upload API and uploads `apps_infra/scripts/data/sample_order.csv` to S3.
- On upload, the Order Upload Lambda is triggered, stores the orders in DynamoDB, and launches the Optimization Engine ECS Task.
- Track progress under the **Solver Jobs** menu. When it finishes, the detail page shows the per-vehicle dispatch result and driving routes on the map.

> The order date and warehouse code used for the upload can be adjusted via the `ORDER_DATE` and `WAREHOUSE_CODE` variables near the top of the script.

---

## 4. Uninstall

### 4.1 Delete CloudFormation Stacks

```bash
cd apps_infra
pnpm destroy:dev
```

The 5 stacks are torn down in reverse dependency order: **Optimization Engine / Distance Cache / OrderUpload / Backend → PersistentBackend**.

### 4.2 Manually Clean Up Remaining Resources

CloudFormation does not delete every resource automatically. Work through the checklist below.

1. **Empty & delete S3 buckets**
   - Find the buckets named `<namespace>-*` (e.g. `devproto-*`) in the S3 console.
   - Back up any data you need to keep to another bucket.
   - **Empty** each bucket, then **Delete**.
2. **Delete DynamoDB tables**
   - Tables with `RemovalPolicy=DESTROY` are already removed by `destroy:dev`. Remove anything that survived (for example, tables created manually or protected by a retention policy) from the DynamoDB console.
3. **Delete ECR repositories / images**
   - Clean up any images left in the ECR repositories (`cdk-*-container-assets-*`) that CDK created for ECS image assets.
4. **Delete CloudWatch log groups**
   - Remove `/aws/lambda/<namespace>-*` and `/aws/ecs/<namespace>-*` log groups from the CloudWatch Logs console.
5. **Cognito User Pool**
   - If you want to fully wipe administrator accounts and user data, delete the User Pool from the Cognito console.

> The `CDKToolkit` stack created by CDK bootstrap may be shared with other CDK projects in the same account/region. Delete it last, and only if you are sure it is no longer needed.
