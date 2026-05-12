# Delivery Route Optimization — Web App

React 19 + Vite + pnpm 기반 배송 경로 최적화 웹 UI.
CDK 가 배포한 백엔드(Cognito / API Gateway / S3-CloudFront) 에 연결되어 Warehouse / CustomerLocation / Vehicle / Order / DistanceCache / SolverJob 을 관리하고, 최적화 결과를 지도 위에 시각화한다.

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 런타임 | Node.js ≥ 20.19 |
| 패키지 매니저 | pnpm ≥ 9 |
| 빌드/개발 서버 | Vite 7 + `@vitejs/plugin-react` 5 |
| 언어 | TypeScript 5.7 |
| UI 프레임워크 | React 19 + `@cloudscape-design/components` 3 |
| 라우팅 | `react-router-dom` 7 |
| 인증/API | `aws-amplify` 6 (Cognito, REST) + `@aws-amplify/ui-react` 6 |
| 지도 | `react-map-gl` 8 (`/maplibre` 엔트리) + `maplibre-gl` 5 + OpenFreeMap 타일 + `@mapbox/polyline` (polyline 인코딩 유틸) |
| 상태/유틸 | `immer` 11, `use-immer`, `dayjs`, `axios`, `uuid` |
| Lint/Format | ESLint 9 (Flat config) + Prettier 3 |

## 폴더 구조

```
apps_web/
├── public/
│   ├── favicon/
│   ├── manifest.json
│   ├── robots.txt
│   └── static/appvars.js     # 런타임 환경변수 (gitignore, 배포 시 CDK 가 S3로 업로드)
├── src/
│   ├── main.tsx              # 엔트리 (createRoot + Amplify init)
│   ├── App.tsx
│   ├── components/           # AppRoot, AppLayout, AppHeader, MapComponent 등
│   ├── pages/                # Warehouse, Vehicle, CustomerLocation, Order,
│   │                         #   DistanceCache, SolverPage, HomePage
│   ├── contexts/             # AuthenticatedUserContext + 리소스별 Data/Query 컨텍스트
│   ├── services/             # CRUD / Query 서비스, Amplify 초기화
│   ├── api/                  # REST 래퍼 (Amplify v6 기반)
│   ├── models/               # 도메인 타입
│   ├── utils/                # 공통 유틸 (dayjs, color, badge, geo 계산)
│   ├── config/               # 런타임 appvars 바인딩
│   └── @types/global.d.ts    # `appVariables` 전역 선언
├── index.html                # Vite 엔트리 (`/static/appvars.js` 로드 포함)
├── vite.config.ts
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.mjs
├── .prettierrc
├── package.json
└── pnpm-lock.yaml
```

## 실행

### 사전 준비

1. Node.js ≥ 20.19, pnpm ≥ 9 설치
2. 배포된 백엔드 정보를 담은 `public/static/appvars.js` 를 준비한다.

   - **방법 A. CDK 가 생성한 파일 가져오기 (권장)**
     `apps_infra` 를 먼저 배포했다면 S3 웹 호스팅 원본에 이미 `/static/appvars.js` 가 업로드되어 있다.
     로컬 개발용으로 내려받으려면 `apps_infra/scripts/pull-appvars-js.sh` 를 사용한다.

     ```bash
     # apps_infra 에서 실행 (AWS_PROFILE / AWS_REGION 설정 필요)
     cd ../apps_infra
     ./scripts/pull-appvars-js.sh
     # 생성된 파일을 apps_web 에 복사
     cp path/to/pulled/appvars.js ../apps_web/public/static/appvars.js
     ```

   - **방법 B. 직접 작성**
     배포 후 출력되는 CloudFormation Outputs 값으로 직접 채운다.

     ```js
     // apps_web/public/static/appvars.js
     const appVariables = {
       REGION: 'us-east-1',
       USERPOOL_ID: 'us-east-1_xxxxxxxxx',
       USERPOOL_CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
       API_URL: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/prod/',
     }
     ```

   > `appvars.js` 는 gitignore 되어 있고, 프로덕션에서는 CDK 가 배포 시점에 S3 로 업로드한다.

### 스크립트

```bash
pnpm install                  # 의존성 설치
pnpm dev                      # 개발 서버 (http://localhost:3000)
pnpm build                    # 프로덕션 빌드 → dist/
pnpm preview                  # 빌드 결과 미리보기
pnpm typecheck                # 타입 검사 (tsc -b --noEmit)
pnpm lint                     # ESLint 실행
pnpm format                   # Prettier 자동 포맷팅
```

## 런타임 환경 변수 (`appvars.js`)

| 키 | 설명 |
| --- | --- |
| `REGION` | AWS 리전 (예: `ap-northeast-2`) |
| `USERPOOL_ID` | Cognito User Pool ID |
| `USERPOOL_CLIENT_ID` | Cognito User Pool Client ID |
| `API_URL` | API Gateway 베이스 URL (뒤에 `/api/web` 이 자동 결합) |

`src/config/appvars.ts` 에서 각 키를 검증하며, 누락 시 명확한 에러 메시지를 던진다.

## 주요 API 계층

- `src/services/base/amplify.ts` — Amplify v6 초기화 및 `getAuthHeaders()` 헬퍼
- `src/api/Common.ts` — REST 공통 래퍼 (매 요청마다 Cognito ID 토큰 자동 주입)
- `src/services/base/crudService.ts` / `queryService.ts` — 리소스별 CRUD/Query 추상화

Amplify v6 에서는 설정 레벨의 `custom_header` 콜백이 제거되었으므로, 각 호출 시점에 `getAuthHeaders()` 로 토큰을 조회해 `options.headers` 로 전달한다.

## Cloudscape UI 참고

- 전역 스타일은 `main.tsx` 에서 `@cloudscape-design/global-styles/index.css` 를 한 번 import 한다.
- 레이아웃은 `TopNavigation` + `AppLayout` (`navigation`, `breadcrumbs`, `content` slot) 조합으로 구성.
- 테이블은 `Table` + `columnDefinitions` (id/header/cell/sortingField) 구조이며, 내부 내비게이션은 `Link` 의 `onFollow` 콜백에서 `navigate()` 로 처리한다.

## 라우팅

- `react-router-dom` v7 `<BrowserRouter>` + `<Routes>` + `<Route element={...} />` 패턴
- 각 섹션은 `src/pages/<Section>/router/index.tsx` 에서 `Routes` 로 정의
- 프로그램 내 이동은 `useNavigate()` 훅 사용

## 지도

- `react-map-gl` v8 의 `/maplibre` 엔트리 (`react-map-gl/maplibre`) + `maplibre-gl` v5 기반
- 타일/스타일은 [OpenFreeMap](https://openfreemap.org) (`https://tiles.openfreemap.org/styles/liberty`) 을 사용하여 **API 키가 필요 없다**
- `initialViewState` + `onMove` 로 뷰 상태 관리
- 커스텀 마커는 `<Marker>` 래퍼 + 인라인 SVG 조합 (`src/components/MapPin`)
- 경로 문자열(encoded polyline 5) 디코딩에는 `@mapbox/polyline` 유틸을 사용한다 (네트워크 호출 없음, Mapbox 계정/토큰과 무관)

## 라이선스

MIT-0 — 저장소 루트의 [`LICENSE`](../LICENSE) 참조. 마이그레이션 이력은 루트 [`CHANGELOG.md`](../CHANGELOG.md) 에 정리되어 있다.
