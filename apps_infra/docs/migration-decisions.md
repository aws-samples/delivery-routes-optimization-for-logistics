# Infra Migration 결정 사항 질문지

이 문서는 `delivery-routes-optimization-for-logistics/apps/infra` 를 `apps_infra/` 로 마이그레이션할 때 design 문서에 반영해야 할 핵심 결정 사항을 정리한 질문지입니다. 각 항목의 배경, 옵션, 추천안을 확인한 뒤 답변을 남겨 주세요. 답변을 기반으로 design.md 를 확정합니다.

> **공통 전제**
> - CDK 버전: aws-cdk-lib `2.252.0` (최신)
> - constructs: `^10.4.2` (CDK 2.252.0 와 호환되는 라인)
> - 패키지 매니저: pnpm
> - lerna / yarn workspaces 제거 → single-package
> - Lambda 런타임: Node.js 24
> - 기존 `apps/infra` 디렉토리만 대상 (website, opt-engine 별개 프로젝트)

---

## D1. `@aws-samples/*` 내부 패키지 의존성 처리 방식

### 배경
기존 `apps/infra` 는 monorepo 내부 7개 패키지를 import 합니다.

- `@aws-samples/common` (packages/@infra/common)
- `@aws-samples/cognito-auth`
- `@aws-samples/data-storage`
- `@aws-samples/web-hosting`
- `@aws-samples/networking`
- `@aws-samples/api-web`
- `@aws-samples/api-order`
- `@aws-samples/ecs-task`

이 패키지들은 npm 레지스트리에 게시되어 있지 않고, 내부적으로 Lambda 코드와 CDK constructs 를 동시에 포함하고 있어 **infra 를 single-package 로 만들려면 이 의존성을 어떻게 흡수할지** 결정해야 합니다.

### 옵션
- **옵션 A (추천): 소스 인라인 병합**
  - 각 `@infra/*` 패키지의 `src/**` 를 `apps_infra/src/constructs/{package-name}/` 로 복사/정리
  - Lambda 핸들러 코드(`@infra/*/src/.../handler/*`) 는 `apps_infra/src/lambda/{function-name}/` 로 이동
  - import 경로는 상대경로 또는 tsconfig paths (`@constructs/*`, `@lambda/*`) 로 재작성
  - 장점: 단일 패키지로 완전히 독립, 빌드/배포가 단순해짐
  - 단점: 초기 이관 작업량 많음
- **옵션 B: pnpm 로컬 link (file: 프로토콜)**
  - `apps_infra/packages/` 아래에 원본 패키지들을 복사해 두고 `package.json` 에 `"@aws-samples/common": "workspace:*"` 또는 `"file:./packages/common"` 으로 참조
  - 장점: 내부 구조 최소 변경
  - 단점: single-package 요구사항과 상충, pnpm workspace 가 다시 필요해짐
- **옵션 C: 별도 프라이빗 레지스트리 게시 후 의존**
  - CodeArtifact 등에 게시 후 npm 의존
  - 장점: 경계 명확
  - 단점: 인프라 + 배포 파이프라인 필요, 오버엔지니어링

### 추천
**옵션 A (소스 인라인 병합)**. single-package 요건과 가장 잘 맞고 Lambda 런타임/CDK 업그레이드를 한 번에 수행 가능.

### 질문
- [ ] 선택: A (소스 인라인 병합)
- [ ] 선택: B (로컬 file link)
- [ ] 선택: C (프라이빗 레지스트리)
- [x] 기타 (자유 기술): 옵션A 관점에서 재개발 할 거야. 각 모듈은 construct 로 충분히 구성 할 수 있어. 종속성 있는 lambda 는 cdk 코드와 별개의 폴더에 lambda 코드관리를 위한 폴더를 만들고 CDK 의 NodeJSFunction 을 활용하는 방안으로 전면 재분석해서 재작성하는 수준까지 고려해 줘.

---

## D2. `website` / `opt-engine` 경로 참조 처리

### 배경
- `BackendStack` 은 `findUp('apps', ...)` 후 `apps/website/build` 를 CloudFront 배포용 번들로 사용합니다.
- `DistanceCacheStack`, `OptimizationEngineStack` 은 `opt-engine/build/{distancecache-util, nextday-delivery}` Docker 이미지 경로를 참조합니다.
- 이번 스코프에서 website 와 opt-engine 은 `apps_infra` 에 포함되지 않습니다.

### 옵션
- **옵션 A (추천): 환경 변수 + config 기반 경로 주입**
  - `config/default.yml` 또는 `.env` 에 `WEBSITE_BUNDLE_PATH`, `OPT_ENGINE_BUILD_PATH` 등을 정의
  - 기본값은 상대 경로(예: `../apps_web/build`, `../apps_opt_engine/build`) 로 두되, CI 에서는 명시적으로 지정
  - Stack 코드에서 `findUp` 대신 절대 경로 기준으로 검증
- **옵션 B: assets 디렉토리로 선복사 후 상대경로 고정**
  - 배포 전 `apps_infra/assets/website/`, `apps_infra/assets/opt-engine/{...}/` 로 복사 스크립트 실행
  - CDK 코드는 고정 경로만 알면 됨
- **옵션 C: 기존 `findUp('apps', ...)` 로직 유지**
  - 사일로된 레포로 migrate 된 후에는 작동하지 않으므로 사실상 불가

### 추천
**옵션 A + (선택적) B 조합**. config 로 경로를 받되 CI/CD 에서는 복사 스크립트로 assets 를 로컬화하는 것이 안전.

### 질문
- [ ] 선택: A (config/env 기반 경로)
- [ ] 선택: B (assets 디렉토리 선복사)
- [ ] 선택: A + B 조합
- [ ] 기타: website 와 opt-engnie 은 stub 로 대체할거야. stub 폴더를 만들고 그 안에 index.html 하나 들어있는 웹페이지와, 간단한 nginx 가 있는 Dockerfile 에 컨테이너 기동 health check 정도 할 수 있는 수준으로 stub 을 만들고 나중에 마이그레이션 완료 후 통합하자.

> 참고: 추천이 A + B 조합입니다. 

---

## D3. config 모듈 (`node-config`) 교체 여부

### 배경
현재 `config/index.ts` 는 `config` 패키지 v3.3.6 과 `find-up` v5 (ESM 화된 v6 가 아닌 CJS 호환 마지막 메이저) 를 사용합니다. CDK 2.252 + Node.js 24 환경에서는:
- `find-up` v5 는 여전히 CJS 지원하므로 유지 가능
- `config` v3 은 최신 버전(v4) 에서 API 가 호환되지만 deprecated 패턴 일부 존재
- 신규 표준은 Zod + yaml 파서 또는 environment + dotenv 조합

### 옵션
- **옵션 A: 기존 `node-config` + yaml 유지 (v4 업그레이드)**
  - `config` 패키지 v4.x, `find-up` v7 (ESM) 또는 v5 유지
  - 최소 변경 원칙, 기존 `config/default.yml`, `RootConfig.ts` 재사용 가능
- **옵션 B (추천): Zod 기반 config 로더 자작**
  - `yaml` (또는 `yaml`/`js-yaml`) + `zod` + `dotenv`
  - 타입 안정성 증가, 의존성 축소, `NODE_CONFIG_ENV` 관례 제거
  - 기존 `default.yml` 을 그대로 사용하되 로딩/검증 방식만 교체
- **옵션 C: 단순 JSON/TS 파일로 평탄화**
  - yaml 제거, `config/default.ts` 에서 named export
  - 가장 단순하지만 env 별 override 패턴을 직접 구현해야 함

### 추천
**옵션 A (유지, 마이너 업그레이드)**. 마이그레이션 범위를 최소화하고 `cdk.context.json`, 관리자 이메일 등 기존 값 교체 부담 감소. Zod 리팩터링은 차기 과제로.

### 질문
- [ ] 선택: A (node-config v4 유지)
- [x] 선택: B (Zod 기반 자작 로더)
- [ ] 선택: C (단순 TS config)
- [ ] 기타:

---

## D4. Node.js 24 런타임 대응 범위

### 배경
기존 Lambda 7+ 개가 `lambda.Runtime.NODEJS_16_X` 로 선언되어 있고, 대부분 `@infra/common/DeclaredLambdaFunction` 에 default 로 하드코딩되어 있습니다. CDK 2.252 는 `Runtime.NODEJS_22_X` 까지 네이티브 지원하며, **Node.js 24 는 CDK 에 `NODEJS_LATEST` 또는 `Runtime.of('nodejs24.x', ...)` 로 명시 필요**합니다 (AWS Lambda 공지 시점에 따라 조정 필요).

### 옵션
- **옵션 A (추천): 중앙 상수 + `Runtime.of('nodejs24.x', Family.NODEJS)`**
  - `apps_infra/src/constants.ts` 에 `LAMBDA_RUNTIME = Runtime.of('nodejs24.x', RuntimeFamily.NODEJS)` 선언
  - 모든 Lambda/Layer 가 해당 상수를 참조
  - 향후 런타임 교체 지점 1곳
- **옵션 B: `Runtime.NODEJS_LATEST` 사용**
  - CDK 가 정의한 최신 지원 버전 자동 선택
  - 단점: 빌드 시점에 따라 버전 바뀌어 재현성 떨어짐
- **옵션 C: enum 이 지원되는 버전 (예: NODEJS_22_X) 사용**
  - Node.js 24 미지원이라면 대체안

### 추가 확인
- AWS Lambda 가 **nodejs24.x** 런타임을 GA 지원하는지 배포 리전에서 확인 필요 (2025-10 기준 GA 상태인 경우가 대부분이나 배포 리전 ap-northeast-2 에서 반드시 확인)
- 미지원 시 `NODEJS_22_X` 로 fallback 하는 조건부 로직 포함 여부

### 질문
- [ ] 선택: A (Runtime.of + 중앙 상수)
- [ ] 선택: B (NODEJS_LATEST)
- [ ] 선택: C (NODEJS_22_X fallback)
- [x] 기타: NODEJS_24_X 와 같이 넣자. 

---

## D5. `cdk.context.json` 재사용 여부

### 배경
기존 파일은 계정 `889680305861`, 리전 `ap-northeast-2` 의 AZ 캐시만 포함합니다. 신규 계정/리전에서 배포할 경우 무의미하며, 반대로 동일 계정을 계속 사용한다면 재합성 시간 단축 효과가 있습니다.

### 옵션
- **옵션 A (추천): 빈 `cdk.context.json` 으로 초기화**
  - 신규 배포 계정에서 CDK 가 자동 lookup → 새 context 생성
  - 장점: 과거 계정 정보 제거
- **옵션 B: 기존 파일 그대로 복사**
  - 동일 계정 계속 사용 시 합성 시간 절약
- **옵션 C: 파일 자체 제거, `.gitignore`**
  - context lookup 결과가 빌드 재현성에 영향을 주는 패턴을 피하려면

### 추천
**옵션 A (빈 파일 초기화)**. 배포 계정이 바뀔 가능성이 높고, 새로 생기는 context 는 CI 에서 첫 합성 시 자동으로 채워집니다.

### 질문
- [x] 선택: A (빈 파일)
- [ ] 선택: B (그대로 복사)
- [ ] 선택: C (파일 제거/gitignore)
- [ ] 기타:

---

## D6. 테스트 프레임워크 및 버전

### 배경
현 설정은 Jest 27 + ts-jest 27. CDK 2.252 와 Node.js 24 환경에서는:
- Jest 29.x 가 안정 (Node.js 20/22 검증됨, 24 에서도 정상 동작)
- ts-jest 29.x 와 pair
- 혹은 **Vitest** (ESM/TS 네이티브, pnpm 친화) 로 전환 가능

### 옵션
- **옵션 A (추천): Jest 29 + ts-jest 29**
  - 기존 `test/infra.test.ts` 구조 재사용, learning curve 없음
  - CDK `assertions` 모듈과 검증된 조합
- **옵션 B: Vitest + @swc/core**
  - 더 빠른 실행, ESM 친화
  - CDK 커뮤니티 레퍼런스 적음
- **옵션 C: Node.js built-in test runner (`node --test`)**
  - 추가 의존성 없음
  - 커버리지/모킹 기능 제한적

### 추천
**옵션 A (Jest 29)**. CDK snapshot/assertion 예제가 풍부하고 팀에 친숙.

### 질문
- [x] 선택: A (Jest 29)
- [ ] 선택: B (Vitest)
- [ ] 선택: C (Node built-in test)
- [ ] 기타:

---

## D7. 마이그레이션 실행 전략

### 배경
전체 변경이 (CDK 버전, 런타임, 패키지 구조, 의존성 리팩터링) 커서 단일 PR 로 진행하면 리뷰/리스크 관리가 어렵습니다.

### 옵션
- **옵션 A (추천): 점진 단계 (tasks.md 단위로 분할 커밋/PR)**
  1. 스캐폴딩 (package.json, tsconfig, cdk.json, 빈 bin)
  2. config 이관
  3. common/infra constructs 이관 (하나씩)
  4. Lambda 핸들러 이관 + 런타임 상수화
  5. 각 Stack 이관 (Persistent → Backend → OrderUpload → DistanceCache → OptimizationEngine)
  6. 테스트/ synth 검증, cfn-nag 통합
- **옵션 B: 한 번에 전체 이관 후 수정**
  - 장점: 병합 충돌 최소
  - 단점: 대형 PR, 문제 발생 시 격리 어려움

### 추천
**옵션 A (점진 단계)**. tasks.md 단계로 자연스럽게 매핑 가능.

### 질문
- [x] 선택: A (점진 단계)
- [ ] 선택: B (단일 big-bang)
- [ ] 기타:

---

## D8. CDK v2 API Breaking Change 대응

### 배경
CDK `2.59 → 2.252` 사이에 다음 breaking change 가 누적됩니다 (이번 코드에서 특히 관련 있는 항목):

1. **BucketEncryption 기본값 변경 / 명시 권장** — `WebsiteHosting` 내부에서 명시되어 있는지 재점검 필요
2. **aws-s3-deployment 의 Lambda 런타임 기본값 자동 승격** — 현재 NODEJS_16_X 경고 유발
3. **cdk.context.json snapshot mismatch** — deprecated feature flag 변경
4. **Runtime.NODEJS_16_X 사용 시 deprecation warning** — 이번 업데이트로 해소
5. **aws-ec2 IVpc lookup 방식** — `Vpc.fromLookup` vs `Vpc.fromVpcAttributes` 차이
6. **CfnOutput exportName 전역 중복 금지 강화**
7. **Docker image asset API** — `ecs.ContainerImage.fromAsset` 옵션 변화 (platform, buildArgs)

### 옵션
- **옵션 A (추천): 사전 호환성 체크리스트 수립 후 Stack 별 검증**
  - design.md 에 체크리스트 포함
  - 각 Stack 이관 태스크에서 체크리스트 적용 확인
- **옵션 B: 변경점은 발생 시점에 수정**
  - 계획 간소화
  - 단점: 재작업 가능성

### 추천
**옵션 A (사전 체크리스트)**. Design 단계에서 스택별 위험도 가시화.

### 질문
- [x] 선택: A (사전 체크리스트)
- [ ] 선택: B (on-the-fly 수정)
- [ ] 기타:

---

## D9. 빌드 / 배포 파이프라인

### 배경
기존 스크립트는 yarn + lerna 기반이며 cfn-nag 검사 스크립트를 포함합니다. pnpm 기반 single-package 구조에서:

### 옵션
- **옵션 A (추천): pnpm scripts + CDK CLI 직접 호출**
  - `pnpm build`, `pnpm test`, `pnpm synth`, `pnpm deploy`, `pnpm deploy:dev`
  - cfn-nag 는 별도 스크립트로 유지 (`pnpm review`)
- **옵션 B: projen / nx 도입**
  - 자동 생성의 이점
  - 단점: 새 학습 곡선, 요구사항과 무관
- **옵션 C: Makefile + pnpm 혼합**
  - 언어 친화적이지만 요건과 비의존

### 추천
**옵션 A (pnpm scripts 단순화)**.

### 질문
- [x] 선택: A (pnpm scripts)
- [ ] 선택: B (projen/nx)
- [ ] 선택: C (Makefile)
- [ ] 기타:

---

## D10. 기타 결정 필요 항목

### 10.1 TypeScript 버전
- 기존 `^4.5.5`
- 추천: **TypeScript 5.6.x** (CDK 2.252 호환, strict enhancement 활용)
- 질문: (x) 5.6.x  ( ) 5.4.x  ( ) 기타 ______

### 10.2 Node.js 엔진 제약 (`engines` 필드)
- 추천: `"engines": { "node": ">=20 <25", "pnpm": ">=9" }` (Lambda runtime 과 분리)
- 질문: (x) 추천 적용  ( ) 버전 변경 ______

### 10.3 License/Copyright 헤더 유지
- 기존 `SPDX-License-Identifier: MIT-0` 및 Copyright 주석을 모든 파일에 유지
- 질문: (x) 유지  ( ) 제거  ( ) 내용 변경 ______

### 10.4 lint 설정 (ESLint)
- 기존 `@config/eslint` 프리셋 의존. 단일 패키지에서는 `eslint` + `@typescript-eslint` 로 재구성 추천
- 질문: (x) 표준 `@typescript-eslint` 설정으로 재구성  ( ) 기존 프리셋 포팅  ( ) 기타 ______

### 10.5 README / 문서
- 기존 루트 README 는 monorepo 기준. `apps_infra/README.md` 를 새로 작성 추천.
- 질문: (x) 신규 README 작성  ( ) 생략 (별도 태스크로)  ( ) 기타 ______

---

## 답변 가이드

1. 위 각 항목에서 선택지 옆 `[ ]` 를 `[x]` 로 수정하고, 필요 시 "기타" 란에 내용을 추가해 주세요.
2. 여러 항목에 의견을 자유롭게 남겨 주셔도 됩니다.
3. 답변 완료 후 채팅창에 "답변 완료" 또는 보충 설명을 남겨 주시면 design.md 초안을 작성합니다.
