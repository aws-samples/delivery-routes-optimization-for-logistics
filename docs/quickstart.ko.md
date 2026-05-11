# Quickstart Guide

이 문서는 프로젝트를 로컬 머신에서 빌드해서 AWS 계정으로 배포하기까지 필요한 단계들을 정리한 것입니다.

---

## 1. Requirements

프로젝트를 빌드 및 배포하기 위해 다음 도구와 버전이 필요합니다.

### 1.1 Dev Tools

| 항목 | 버전 / 비고 |
|---|---|
| **JDK** | **21** (Amazon Corretto 21 또는 Temurin 21 권장) — `apps_opt_engine` 빌드용 |
| **Node.js** | **`>=20.19 <25`** — `apps_web`, `apps_infra` 빌드용 |
| **pnpm** | **`>=9`** (권장: `pnpm@9.12.0`) |
| **Gradle Wrapper** | 저장소에 포함 (`./gradlew`) — JDK 21 이 잡혀 있으면 별도 설치 불필요 |
| **Docker** | `cdk synth` / `cdk deploy` 시 ECS 이미지 자산 빌드에 필요 |
| **AWS CLI** | **v2** ([설치 가이드](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html)) |
| **git**, **bash**, **zip**, **jq** | 쉘 스크립트 실행에 필요 |

### 1.2 기술 스택 버전

| 레이어 | 스택 |
|---|---|
| **Optimization Engine** (`apps_opt_engine`) | Java 21 · Spring Boot 3.5.14 · OptaPlanner 10.2.0 · GraphHopper 11.0 · AWS SDK v2 (2.42.x) · Gradle 8.x (Kotlin DSL, 멀티모듈) |
| **Web App** (`apps_web`) | React 19 · Vite 7 · TypeScript 5.7 · Cloudscape Design · AWS Amplify 6 · MapLibre GL · react-map-gl 8 |
| **Infrastructure** (`apps_infra`) | AWS CDK 2.252 · TypeScript 5.6 · Node 20~24 Lambda runtime · cfn-nag(선택) |

### 1.3 AWS 계정

- 애플리케이션 배포에 필요한 권한을 가진 **AWS 계정** ([계정 생성](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/))

---

## 2. Deployment

### 2.1 AWS 크레덴셜 준비

CDK 는 쉘 환경의 AWS 크레덴셜을 그대로 사용합니다. 아래 두 방식 중 하나를 선택해 주세요.

**방법 A. `AWS_PROFILE` 환경변수 사용 (권장)**

`~/.aws/credentials` / `~/.aws/config` 에 이미 프로필이 구성되어 있다면 프로필 이름만 지정하면 됩니다.

```bash
export AWS_PROFILE=my-deployment-profile
export AWS_REGION=us-east-1
```

**방법 B. `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` 환경변수 직접 설정**

```bash
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...        # 임시 자격증명(STS/SSO)일 때만
export AWS_REGION=us-east-1
```

설정 후 아래 명령으로 크레덴셜이 정상 인식되는지 확인합니다.

```bash
aws sts get-caller-identity
```

### 2.2 빌드 및 배포 순서

> **순서가 중요합니다.** `apps_infra` 의 CDK 스택은 `apps_web/dist` 와 `apps_opt_engine/build/{distancecache-util,nextday-delivery}` 산출물을 ECS/웹 호스팅 자산으로 참조합니다. 따라서 **Optimization Engine → Web → Infra** 순으로 빌드·배포해야 합니다.

#### Step 1. Optimization Engine 빌드

```bash
cd apps_opt_engine
./build_opt_engine.sh
```

이 스크립트는 다음을 수행합니다.

- **JDK 21 탐색** — macOS 에서는 `/usr/libexec/java_home -v 21` 로 자동 설정, Linux/CI 에서는 `JAVA_HOME` 환경변수(또는 PATH 의 `java`) 를 사용하며 메이저 버전 21 을 검증
- **OSM PBF 파일 준비** — `$HOME/.graphhopper/openstreetmap/south-korea-latest.osm.pbf` 가 없으면 [Geofabrik](https://download.geofabrik.de/asia/south-korea.html) 에서 자동 다운로드, 이미 있으면 그대로 사용
- `./gradlew clean :apps:nextday-delivery:bootJar :apps:distancecache-util:shadowJar`
- 산출물 패키징
  - `build/distancecache-util/` — distance cache CLI jar + `Dockerfile` + OSM PBF
  - `build/nextday-delivery/` — 최적화 엔진 jar + `solver-config.xml` + `Dockerfile` + OSM PBF

> Linux/CI 에서는 JDK 21 설치 후 `JAVA_HOME` 을 export 해 주세요. 예: `export JAVA_HOME=/usr/lib/jvm/java-21-openjdk`
> OSM 파일 경로/URL 은 `OSM_FILE`, `OSM_URL` 환경변수로 override 할 수 있습니다.

#### Step 2. Web App 빌드

```bash
cd apps_web
pnpm install
pnpm build
```

빌드 결과물은 `apps_web/dist/` 에 생성되며, 이후 `apps_infra` 가 이 디렉터리를 CloudFront + S3 웹 호스팅 자산으로 사용합니다.

#### Step 3. Infrastructure 설정 수정

`apps_infra/config/default.yml` 을 열고 본인 환경에 맞게 값을 수정합니다.

```yaml
env:
  account: '025066253622'          # ← 본인 AWS 계정 ID (12자리)
  region: us-east-1                # ← 배포 리전

namespace: devproto                # ← 리소스 네임스페이스 (영문 소문자/숫자 권장)

administratorEmail: your-email@example.com   # ← Cognito 관리자 임시 비밀번호 수신 이메일
administratorName: Administrator

assets:
  websiteBundlePath: ../apps_web/dist
  distanceCacheDockerPath: ../apps_opt_engine/build/distancecache-util
  optEngineDockerPath: ../apps_opt_engine/build/nextday-delivery
```

> 환경변수로도 override 할 수 있습니다: `CDK_DEFAULT_ACCOUNT`, `CDK_DEFAULT_REGION`, `ADMINISTRATOR_EMAIL`.

#### Step 4. Infrastructure 배포

```bash
cd apps_infra
pnpm install
pnpm bootstrap       # 해당 계정/리전에서 최초 1회만 (CDK bootstrap)
pnpm deploy:dev      # 모든 스택 배포 (--require-approval never --all)
```

`pnpm deploy:dev` 는 5개 CloudFormation 스택을 순차적으로 생성합니다.

1. `PersistentBackendStack` — VPC / DynamoDB(7개) / S3 / Cognito / CloudFront
2. `BackendStack` — ApiWeb (Lambda 10개) / 웹 번들 배포 / `appvars.js` 생성
3. `OrderUploadStack` — Order Upload API (Lambda 3개) / S3 / API Key
4. `DistanceCacheStack` — Distance Cache ECS EC2 Task
5. `OptimizationEngineStack` — Nextday Delivery ECS EC2 Task

배포가 완료되면 Cognito 관리자 임시 비밀번호가 `administratorEmail` 로 발송되며, 콘솔 출력에서 CloudFront 웹 URL을 확인할 수 있습니다.

### 2.3 배포 검증

```bash
# 스택이 모두 CREATE_COMPLETE 인지 확인
aws cloudformation list-stacks \
  --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE

# 변경 사항 미리보기
cd apps_infra && pnpm diff
```

웹 UI 접속은 `apps_infra/scripts/open-demo-webui.sh` 스크립트로도 열 수 있습니다.

---

## 3. Run Demo

배포된 환경에서 샘플 주문을 올리고 최적화를 돌려 보는 과정입니다. 스크립트는 모두 `AWS_PROFILE` / `AWS_REGION` 환경변수를 사용하며, §2.1 에서 이미 설정했다면 추가 준비가 필요 없습니다.

### 3.1 Master Data 업로드

```bash
cd apps_infra
./scripts/upload-master-data.sh
```

스크립트가 SSM Parameter Store 에서 DynamoDB 테이블 이름을 조회한 뒤, 샘플 Warehouse / Customer Location / Vehicle 데이터를 put-item 합니다. 업로드된 데이터는 웹 UI 의 해당 메뉴에서 즉시 확인할 수 있습니다.

### 3.2 Web UI 접속 및 계정 생성

```bash
./scripts/open-demo-webui.sh
```

- 브라우저에서 CloudFront 도메인이 열립니다.
- Cognito 임시 비밀번호 메일을 받은 관리자 계정으로 로그인하고, 안내에 따라 새 비밀번호로 교체합니다.
- 좌측 메뉴에서 **Customer Location / Warehouse / Vehicle** 에 업로드된 마스터 데이터가 보이는지 확인합니다.

### 3.3 Distance Cache 빌드

거리 매트릭스(장소 간 도로 기반 거리) 를 미리 계산해 두어야 솔버 실행 시간이 짧아집니다.

1. 웹 UI 의 **Distance Cache** 메뉴로 이동
2. **Rebuild Distance Cache** 버튼 클릭
3. Warehouse code `95001200` 입력 후 **ReBuild** 클릭
4. ECS Task 가 완료될 때까지 대기 (수 분 소요)

### 3.4 주문 업로드 및 최적화 실행

```bash
./scripts/upload-order-with-presigned-url.sh
```

- 스크립트는 Order Upload API 로부터 presigned URL 을 받아 `apps_infra/scripts/data/sample_order.csv` 를 S3 에 업로드합니다.
- 업로드가 완료되면 Order Upload Lambda 가 트리거되어 주문을 DynamoDB 에 저장하고, Optimization Engine ECS Task 를 실행합니다.
- 웹 UI 의 **Solver Jobs** 메뉴에서 실행 상태를 확인하고, 완료 후 세부 페이지에서 차량별 배차 결과 / 주행 경로를 지도 위에서 확인할 수 있습니다.

> 업로드에 사용되는 주문 날짜 / Warehouse 코드는 스크립트 상단의 `ORDER_DATE`, `WAREHOUSE_CODE` 변수로 조정할 수 있습니다.

---

## 4. Uninstall

### 4.1 CloudFormation 스택 제거

```bash
cd apps_infra
pnpm destroy:dev
```

5개 스택이 역순으로 삭제됩니다. 스택 간 의존성 때문에 **Optimization Engine / Distance Cache / OrderUpload / Backend → PersistentBackend** 순서로 제거됩니다.

### 4.2 수동 정리가 필요한 리소스

CloudFormation 이 자동 삭제하지 않는 리소스들을 아래 순서로 정리합니다.

1. **S3 버킷 비우기·삭제**
   - `<namespace>-*` 로 시작하는 버킷(예: `devproto-*`) 을 S3 콘솔에서 찾습니다.
   - 보존이 필요한 데이터는 먼저 다른 버킷으로 백업합니다.
   - 각 버킷을 **Empty** 후 **Delete**.
2. **DynamoDB 테이블 삭제**
   - `destroy:dev` 시 `RemovalPolicy=DESTROY` 로 설정된 테이블은 자동 삭제되지만, 수동 생성분이나 데이터 보존 정책으로 남은 테이블이 있으면 DynamoDB 콘솔에서 삭제합니다.
3. **ECR 리포지토리 / 이미지 삭제**
   - CDK 가 ECS 이미지 자산을 위해 만든 ECR 리포지토리(`cdk-*-container-assets-*`) 에 남은 이미지를 정리합니다.
4. **CloudWatch Logs 로그 그룹 삭제**
   - `/aws/lambda/<namespace>-*`, `/aws/ecs/<namespace>-*` 로그 그룹을 CloudWatch Logs 콘솔에서 삭제합니다.
5. **Cognito User Pool**
   - 관리자 계정을 포함해 완전히 정리하려면 Cognito 콘솔에서 User Pool 을 삭제합니다.

> CDK bootstrap 이 만든 `CDKToolkit` 스택은 다른 CDK 프로젝트에서 공유될 수 있으므로 마지막까지 확인 후 필요할 때만 삭제합니다.
