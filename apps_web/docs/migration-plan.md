# Route Optimization Web 앱 마이그레이션 계획

## 1. 개요

원본 `delivery-routes-optimization-for-logistics/apps/website` 의 CRA(Create React App) + React 17 기반 프로젝트를 **pnpm + Vite + React 19** 스택으로 마이그레이션 한다.
대상 위치는 `apps_web/` 이며, 원본은 읽기 전용으로 참조만 한다.

## 2. 원본 스택 요약

| 영역 | 원본 |
| --- | --- |
| 빌드 도구 | react-scripts 4.0.3 (CRA / Webpack 4) |
| 언어 | TypeScript 4.5.5 |
| React | 17.0.2 + react-dom 17.0.2 |
| 라우팅 | react-router-dom 5.2.0 |
| 인증/API | aws-amplify 4.2.4, @aws-amplify/auth 4.3.0, @aws-amplify/ui-react 1.2.10, amazon-cognito-identity-js 5.2.3 |
| UI 프레임워크 | aws-northstar 1.3.12 (MUI v4 기반, 유지보수 사실상 중단) |
| 지도 | react-map-gl 6.1.11, mapbox-gl 2.2.0, @mapbox/polyline 1.1.1, worker-loader 3.0.8 |
| 상태/유틸 | immer 9.0.12, use-immer 0.6.0, uuid 8.3.2, dayjs 1.10.7, axios 0.28.0 |
| 기타 | react-intl 5.20.13 (1 파일만 사용, IntlProvider 미설정) |
| 미사용 의존성 | chart.js, react-chartjs-2, react-dropzone, react-dropzone-uploader, react-image-gallery, kaktana-react-lightweight-charts, web-vitals |

## 3. 목표 스택 (2026-05 기준 최신 호환 버전)

| 영역 | 목표 | 비고 |
| --- | --- | --- |
| Node | 22.x LTS 이상 (현 환경 v24.14) | Vite 7 peer 충족 |
| 패키지 매니저 | pnpm 10.x (현 환경 10.33) | |
| 빌드 도구 | **Vite 7.x** + @vitejs/plugin-react 5.x | ESM 기반, HMR 빠름, CRA 대체 사실상의 표준 |
| 언어 | TypeScript 5.9.x | React 19 타입 완벽 지원 |
| React | **19.2.x** + react-dom 19.2.x | |
| 라우팅 | **react-router-dom 7.15.x** | v7는 React 19 peer 지원. v5→v7 직접 점프 |
| 인증/API | **aws-amplify 6.17.x**, @aws-amplify/ui-react 6.15.x | v6는 modular import, React 19 peer 포함 |
| UI 프레임워크 | **@cloudscape-design/components 3.x + @cloudscape-design/global-styles 1.x** | aws-northstar 대체. AWS 공식 디자인 시스템, 현재 console.aws.amazon.com에서 사용 중 |
| 지도 | **react-map-gl 8.x**, mapbox-gl 3.x, @mapbox/polyline 1.2.x | v8는 `Map` 컴포넌트 기반 신 API |
| 상태/유틸 | immer 11.x, use-immer 0.11.x, uuid 11.x, dayjs 1.11.x, axios 1.x | |
| 제거 | aws-northstar, react-intl, chart.js, react-chartjs-2, react-dropzone*, react-image-gallery, kaktana-*, worker-loader, react-scripts, web-vitals, reportWebVitals.ts | src에서 미사용 또는 불필요 |
| Lint/Format | ESLint 9.x (Flat config) + Prettier 3.x | 기존 workspace의 `@aws-samples/eslint` 설정은 제거하고 독립 구성 |

## 4. 대안 검토 요약

### 4.1 aws-northstar (최대 난제)
- **문제**: 1.3.12는 React 17 전용이며 사실상 유지보수 중단. v2-alpha는 불안정하고 오랫동안 릴리즈 없음. MUI v4 기반이라 React 19와 호환 불가.
- **후보**:
  1. **AWS Cloudscape Design System** (`@cloudscape-design/components`) ← 선택
     - AWS 공식 디자인 시스템으로 활발히 유지보수
     - Northstar 이후 사실상 AWS 내부 표준
     - 컴포넌트 범위가 Northstar를 거의 모두 커버 (AppLayout, SideNavigation, BreadcrumbGroup, Table, Form, FormField, Input, Container, Button, Modal, Alert, Popover, Icon, Badge, Checkbox, Link, SpaceBetween, ColumnLayout 등)
     - peer `react >=16.8.0` 로 React 19에서도 동작 확인
  2. MUI v6 + AWS 테마: 가능하지만 AppLayout류 합성 컴포넌트를 스크래치로 만들어야 해 비용 큼
  3. Mantine / Radix UI: 동일 이유로 추천하지 않음
- **결정**: **Cloudscape**로 통일 치환

### 4.2 aws-amplify v4 → v6
- v6는 **모듈식 import**와 SDK v3 기반으로 완전히 재작성됨
- 변경 요약:
  ```ts
  // Before (v4)
  import Amplify, { Auth, API } from 'aws-amplify'
  Amplify.configure({ Auth: { region, userPoolId, userPoolWebClientId }, API: { endpoints: [...] } })
  const session = await Auth.currentSession()
  const user = await Auth.currentAuthenticatedUser()
  const userInfo = await Auth.currentUserInfo()
  const data = await API.get(apiName, path, { queryStringParameters })
  ```
  ```ts
  // After (v6)
  import { Amplify } from 'aws-amplify'
  import { fetchAuthSession, getCurrentUser, fetchUserAttributes, signOut } from 'aws-amplify/auth'
  import { get, post, put, del } from 'aws-amplify/api'

  Amplify.configure({
    Auth: { Cognito: { userPoolId, userPoolClientId, region } },
    API: { REST: { [apiName]: { endpoint, region, custom_header: async () => ({...}) } } },
  })
  const session = await fetchAuthSession()
  const idToken = session.tokens?.idToken?.toString()
  const user = await getCurrentUser()
  const attrs = await fetchUserAttributes()
  const { body } = await get({ apiName, path, options: { queryParams } }).response
  const json = await body.json()
  ```
- `@aws-amplify/ui-react` v6:
  - `withAuthenticator` HOC **유지됨**
  - `AmplifySignOut` **삭제됨** → `useAuthenticator()` 의 `signOut` 사용 또는 Cloudscape Button + 직접 `signOut()` 호출
- `Auth.wrapRefreshSessionCallback`는 제거됨. Hub listener 기반으로 대체:
  ```ts
  import { Hub } from 'aws-amplify/utils'
  Hub.listen('auth', ({ payload }) => { if (payload.event === 'tokenRefresh') rehydrate() })
  ```

### 4.3 react-router-dom v5 → v7
- v5→v6는 큰 변화, v6→v7은 "upgrade 플래그만 켜면 non-breaking"
- 본 프로젝트는 v5에서 v7로 직접 점프하지만 data-mode 기능은 쓰지 않고 `BrowserRouter` + `Routes` 구조 유지 (= v6 기본 모드와 동일 API)
- 변경 요약:
  | v5 | v7 |
  | --- | --- |
  | `Switch` | `Routes` |
  | `<Route path component={C} />` / render | `<Route path element={<C />} />` |
  | `<Route path exact ...>` | `path` 기본이 exact. 중첩시 `*` 사용 (`path="/warehouse/*"`) |
  | `useHistory()` + `history.push(x)` | `useNavigate()` + `navigate(x)` |
  | `useParams<{ id: string }>()` | `useParams() as { id: string }` 또는 동일 제네릭 가능 |
  | path 배열 | 개별 Route 여러 개로 분리 |

### 4.4 react-map-gl v6 → v8
- v6 API는 `<ReactMapGL width height latitude longitude zoom mapboxApiAccessToken onViewportChange />` 와 `MapContext` 기반 좌표 투영
- v8는:
  - `<Map initialViewState={{latitude, longitude, zoom}} mapboxAccessToken={...} style={{width, height}} onMove={e => setViewState(e.viewState)}>`
  - `MapPin` 같은 커스텀 오버레이는 `<Marker>` 로 대체하거나 `useMap()` + `map.project()` 사용
  - `MapContext` 제거됨
- `mapboxgl.workerClass` / `worker-loader` 불필요. mapbox-gl v3는 기본 worker 사용. Vite에서는 `?worker` 쿼리로 필요시 커스텀 가능하지만 대부분 불필요.

### 4.5 미사용 의존성 제거
- chart.js, react-chartjs-2, react-dropzone(-uploader), react-image-gallery, kaktana-react-lightweight-charts, web-vitals → src에서 import 없음. package.json에서 제거.
- react-intl → `InfoPopover` 1개 파일에서만 `FormattedMessage` 사용하며 IntlProvider 설정 없어 ID만 출력되고 있음. react-intl 제거 후 `infoKey`(또는 `infoHeader`) 텍스트를 그대로 렌더링하도록 단순화.

## 5. 디렉터리 구조 (목표)

```
apps_web/
├── docs/
│   ├── migration-plan.md         ← 본 문서
│   └── task-list.md              ← 상세 작업 체크리스트
├── public/
│   ├── favicon/                  ← 원본 그대로
│   ├── manifest.json             ← 원본 그대로
│   ├── robots.txt                ← 원본 그대로
│   └── static/
│       └── appvars.js            ← 런타임 환경 변수 주입용 (gitignore)
├── src/
│   ├── main.tsx                  ← 엔트리 (CRA index.tsx 대체)
│   ├── App.tsx                   ← AppRoot 이관
│   ├── index.css
│   ├── vite-env.d.ts             ← react-app-env.d.ts 대체
│   ├── @types/
│   │   └── global.d.ts
│   ├── api/
│   ├── config/
│   ├── contexts/
│   ├── models/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   └── components/
├── .env.example                  ← (선택) Vite env sample
├── .eslintrc.cjs 또는 eslint.config.mjs
├── .prettierrc
├── .gitignore
├── index.html                    ← Vite 엔트리. <script src="/static/appvars.js"> 포함
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## 6. appvars.js (런타임 구성) 처리 방침

원본은 빌드 결과에 백엔드 리소스 ID를 포함하지 않도록 `public/static/appvars.js` 를 런타임에 서빙하는 방식을 사용한다. Vite에서는:

- `index.html` 내 `<script src="/static/appvars.js"></script>` 로 동일하게 참조 (Vite는 `public/` 내용을 루트로 서빙)
- 배포시 해당 파일은 별도 파이프라인에서 업로드 (원본의 `apps/scripts/pull-appvars-js.sh` 흐름 유지)
- 로컬 개발용 샘플: `public/static/appvars.js` 가 없을 때 안내하도록 `src/config/appvars.ts` 에 guard 유지. `appvars.sample.js` 를 커밋해 두어 로컬 자체실행 가능하도록 선택적 제공 (Vite에선 public 파일 누락시 404 정도로 끝남, 런타임 guard가 에러 메시지 제공)
- `@types/global.d.ts` 에 `declare var appVariables: Record<string, any>` 유지

## 7. CRA → Vite 치환 세부 매핑

| CRA | Vite |
| --- | --- |
| `public/index.html` + `%PUBLIC_URL%` | 루트 `index.html`, `%PUBLIC_URL%` 제거하고 `/` 기준 경로 사용 |
| `src/index.tsx` + `ReactDOM.render` | `src/main.tsx` + `createRoot(el).render(...)` |
| `react-app-env.d.ts` (`/// <reference types="react-scripts" />`) | `src/vite-env.d.ts` (`/// <reference types="vite/client" />`) |
| `process.env.*` / `process.env.PUBLIC_URL` | `import.meta.env.*`, `import.meta.env.BASE_URL` (본 프로젝트 src에선 사용 안 함) |
| `SKIP_PREFLIGHT_CHECK=true react-scripts start/build` | `vite` / `vite build` |
| `react-scripts test` (Jest) | (현재 테스트 코드 없음) Vitest 도입 여지만 열어두되 이번 PR에서는 제외 |
| `worker-loader!...` | `?worker` / `?worker&inline` 혹은 사용 중단 |

## 8. Cloudscape 매핑 표 (Northstar → Cloudscape)

| aws-northstar | @cloudscape-design/components | 비고 |
| --- | --- | --- |
| `NorthStarThemeProvider` | (없음) | `@cloudscape-design/global-styles/index.css` 임포트로 대체 |
| `AppLayout` | `AppLayout` | `content`, `navigation`, `breadcrumbs`, `toolsHide` 슬롯 기반으로 리팩터링 |
| `SideNavigation` + `SideNavigationItemType` | `SideNavigation` + `{ type: 'link'\|'divider'\|...}` | 아이템 타입 문자열로 변경 |
| `BreadcrumbGroup` | `BreadcrumbGroup` | `items` prop 구조 확인 필요 |
| `Header` (AppHeader) | `TopNavigation` | `identity`, `utilities` 슬롯 활용 |
| `Container` (헤더 + 내용) | `Container` + `Header` | `<Container header={<Header variant="h2" actions={...}>제목</Header>}>` |
| `Form` | `Form` | `header`, `actions`, `errorText` 유사 |
| `FormSection` | `Container` + `Header` | Cloudscape에는 FormSection 없음 |
| `FormField` | `FormField` | `controlId`→`controlId` 유사, `label`/`description` |
| `Input` | `Input` | `value`/`onChange={({detail}) => ...}` 패턴 |
| `Checkbox` | `Checkbox` | `checked`/`onChange={({detail}) => ...}` |
| `Button` + `ButtonIcon` | `Button` | `iconName`, `variant` |
| `Inline` | `SpaceBetween direction="horizontal"` | |
| `Stack` | `SpaceBetween direction="vertical"` | |
| `ColumnLayout` / `Column` | `ColumnLayout columns={n}` + 자식들 | |
| `Box` (레이아웃 박스) | `Box` | Cloudscape에도 Box 존재 (variant, padding, color 등) |
| `Text` | `Box variant="span"` 또는 `TextContent` | |
| `Link` | `Link` | `href` 대신 내부 라우팅은 `onFollow` + preventDefault 후 navigate |
| `Badge` | `Badge` | `color` 값 매핑 |
| `Alert` | `Alert` | `type="info/success/warning/error"` |
| `Popover` | `Popover` | `triggerType`, `position`, `content` 유사 |
| `Icon` (MUI 아이콘명) | `Icon` (Cloudscape 아이콘명) | 1:1 매핑 없으면 대체 아이콘 선택 (House→없음, GpsFixed→없음 등은 inline SVG로) |
| `MarkdownViewer` | `react-markdown` | |
| `Modal` | `Modal` | |
| `DeleteConfirmationDialog` | `Modal` 조합 | footer에 Cancel/Delete 버튼 수동 구성 |
| `Table` | `Table` | `columnDefinitions`, `items`, `selectionType`, `pagination`, `filter`, `sortingColumn` 등 풍부 |
| `KeyValuePair` | `KeyValuePair` (v3.x 추가됨) | 없으면 `Box`/`SpaceBetween` 조합으로 자체 구현 |

## 9. Cloudscape AppLayout 레이아웃 (목표)

```tsx
import { AppLayout, SideNavigation, BreadcrumbGroup, TopNavigation } from '@cloudscape-design/components'
import '@cloudscape-design/global-styles/index.css'

<>
  <TopNavigation identity={{ href: '/', title: 'Delivery Route Optimization with Order Dispatching' }}
                 utilities={[{ type: 'button', text: nickname, iconName: 'user-profile' },
                             { type: 'button', text: 'Sign out', onClick: signOut }]} />
  <AppLayout
    navigation={<SideNavigation header={{ text: 'Menu', href: '/' }} items={menuItems} />}
    breadcrumbs={<BreadcrumbGroup items={breadcrumbItems} />}
    content={<Outlet />}
    toolsHide
  />
</>
```

## 10. 리스크와 대응

| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| Cloudscape 아이콘에 Northstar의 `GpsFixed`, `House`, `Face`, `Restaurant`, `PersonPinCircle` 없음 | 지도 마커/UI 아이콘 누락 | 인라인 SVG 또는 `@mui/icons-material` 재사용. 최소 MUI icons만 경량 설치 |
| `react-map-gl` v8 API 재작성 범위 | 지도 4개 컴포넌트 재작성 필요 | 단계별 동등 기능으로 재작성, 시각 테스트 |
| Amplify v6 API 구조 대폭 변경 | 전 서비스 계층 수정 | `api/Common.ts`, `services/base/*` 를 얇은 wrapper로 유지해 호출부 변경 최소화 |
| Cloudscape 컴포넌트 디자인 차이로 UX 변화 | 디자인 QA 필요 | 일차적으로 기능 동작 우선, 디자인 조정은 후속 PR |
| 런타임 `appvars.js` 로딩 타이밍 | ESM 모듈이 `window.appVariables` 없이 실행될 위험 | `index.html` 의 `<script>` 를 **모듈 스크립트 이전에** 배치. `src/config/appvars.ts` 에서 키 누락시 명확한 에러 |
| `react-intl` 제거로 i18n 포기 | 현재 IntlProvider 미설정으로 실질 영향 없음 | `InfoPopover` 간소화하고 키를 직접 출력 |

## 11. 단계적 실행 전략

상세 체크리스트는 `docs/task-list.md` 참조. 큰 단계는 아래와 같다:

1. **Phase 1 - 프로젝트 골격**: package.json, vite.config.ts, tsconfig, index.html, main.tsx, 전역 CSS, appvars 처리
2. **Phase 2 - 외부 의존성 래퍼 마이그레이션**: Amplify v6 초기화, 서비스 wrapper (`api/Common.ts`, `services/base/*`), AuthenticatedUserContext
3. **Phase 3 - 라우팅**: AppRoot/router v7, pages/*/router, `useHistory` → `useNavigate`
4. **Phase 4 - UI 레이아웃**: AppLayout, AppHeader, SideNavigation, BreadcrumbGroup (Cloudscape)
5. **Phase 5 - UI 컴포넌트 치환**: 페이지(List/Details/Editor) 단위로 순차 전환
6. **Phase 6 - 지도**: MapComponent/NextDayDeliveryMap/PolygonMap/MapPin (react-map-gl v8)
7. **Phase 7 - 기타**: InfoPopover(react-intl 제거), Modal/NorthstarEx 래퍼 제거, utils/badge-helper
8. **Phase 8 - 검증**: pnpm install, tsc --noEmit, vite build, 로컬 dev 기동 확인

각 Phase 종료 시 빌드를 돌려 회귀를 조기에 탐지한다.
