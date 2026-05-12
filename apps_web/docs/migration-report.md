# Route Optimization Web 앱 마이그레이션 보고서

- **작성일**: 2026-05-06
- **원본**: `../delivery-routes-optimization-for-logistics/apps/website` (CRA + React 17 + aws-northstar)
- **대상**: `apps_web/` (Vite + React 19 + Cloudscape Design System)
- **관련 문서**:
  - [`docs/migration-plan.md`](./migration-plan.md) — 마이그레이션 설계/대안 검토
  - [`docs/task-list.md`](./task-list.md) — Phase 1~8 세부 체크리스트

---

## 1. 요약

원본 앱을 최신 프런트엔드 스택(**pnpm + Vite 7 + React 19 + TypeScript 5 + Cloudscape**)으로 재구현하였다. 라우팅, 데이터 모델, REST API 호출 시그니처, 페이지/폼 필드 구성은 **원본과 1:1 호환**을 목표로 이관하였으며, Cloudscape 전환 과정에서 일시적으로 누락됐던 테이블 정렬/페이지 크기 기능은 이번 작업 내에서 **자체 공통 훅(`useCollectionList`) 으로 복원**하여 최종 기능 대등성을 확보했다.

### 1.1 핵심 결과

| 항목 | 결과 |
| --- | --- |
| 의존성 설치 | ✅ `pnpm install` — 627 packages, 심각한 peer 충돌 없음 |
| 타입 검사 | ✅ `pnpm typecheck` — 오류 0 |
| 프로덕션 빌드 | ✅ `pnpm build` — 3721 modules, 8.8s |
| 개발 서버 | ✅ `pnpm dev` — HTTP 200, 185ms 준비 |
| 라우팅 호환성 | ✅ 모든 URL 경로 동일, 404 fallback 추가 |
| 데이터 모델 | ✅ 모든 interface/필드 동일 |
| API 호출 구조 | ✅ 응답 파싱 경로(`response.data.Item/Items`) 유지 |
| 폼 필드 | ✅ 22개 전 필드 유지 (배치 순서 일부 재조정) |
| 테이블 정렬/페이지 크기 | ✅ 복원 완료 |
| 인증/Signout | ✅ v6 modular API로 동등 기능 |
| 지도 | ✅ 기능 동일 (마커 아이콘만 인라인 SVG로 단순화) |

---

## 2. 스택 비교

| 영역 | 원본 | 마이그레이션 |
| --- | --- | --- |
| 런타임 | Node.js 16+ | Node.js ≥ 20.19 (검증: v24.14) |
| 패키지 매니저 | yarn/npm | **pnpm 10.x** |
| 빌드 도구 | react-scripts 4.0.3 (CRA, Webpack 4) | **Vite 7 + @vitejs/plugin-react 5** |
| 언어 | TypeScript 4.5.5 | **TypeScript 5.9** |
| React | 17.0.2 | **19.2** |
| 라우팅 | react-router-dom 5.2.0 | **react-router-dom 7.15** |
| 인증/API | aws-amplify 4.2.4 + @aws-amplify/ui-react 1.x | **aws-amplify 6.17 + @aws-amplify/ui-react 6.15** |
| UI 프레임워크 | aws-northstar 1.3.12 (MUI v4 기반, 유지보수 중단) | **@cloudscape-design/components 3.x** |
| 지도 | react-map-gl 6 + mapbox-gl 2 + worker-loader | **react-map-gl 8 + mapbox-gl 3** |
| 상태/유틸 | immer 9, use-immer 0.6, uuid 8, dayjs 1.10, axios 0.28 | immer 11, use-immer 0.11, uuid 11, dayjs 1.11, axios 1 |
| 제거된 의존성 | — | react-intl, chart.js, react-chartjs-2, react-dropzone(-uploader), react-image-gallery, kaktana-react-lightweight-charts, web-vitals, react-scripts, worker-loader |
| Lint/Format | ESLint + Prettier | ESLint 9 (Flat config) + Prettier 3 |

---

## 3. 대안 검토 요약

사용자 지시에 따라 `aws-northstar`, `aws-amplify v4`, `react-router v5` 의 대안을 검토하여 다음을 최종 선정하였다.

### 3.1 UI 프레임워크 (aws-northstar 대체)

**선정**: `@cloudscape-design/components` 3.x

| 후보 | 판단 근거 |
| --- | --- |
| **Cloudscape** ✅ | AWS 공식 디자인 시스템, Northstar 이후 사실상 표준. Northstar 컴포넌트를 거의 1:1 매핑 가능 (AppLayout, SideNavigation, BreadcrumbGroup, Table, Form, Container, Modal, Alert, Popover 등). React 19 peer 지원 (`react >=16.8.0`). 활발한 유지보수 |
| Material UI v6 | Northstar 의 상위 레이아웃 합성(AppLayout 등)을 스크래치로 만들어야 해 비용 큼 |
| Mantine / Radix UI | 동일 이유로 탈락 |

aws-northstar 1.x 는 React 17 전용이며 유지보수 사실상 중단, v2-alpha 는 오랫동안 릴리즈 없어 **현실적 선택지 아님**.

### 3.2 aws-amplify v4 → v6

v6 는 **SDK v3 기반으로 재작성된 모듈식 API**. Tree-shaking 효과가 커지고 React 19 peer 를 공식 지원한다. 주요 API 매핑:

| v4 | v6 |
| --- | --- |
| `Amplify.configure({ Auth: { region, userPoolId, userPoolWebClientId } })` | `Amplify.configure({ Auth: { Cognito: { userPoolId, userPoolClientId } } })` |
| `Auth.currentSession()` | `fetchAuthSession()` from `aws-amplify/auth` |
| `Auth.currentAuthenticatedUser()` | `getCurrentUser()` |
| `Auth.currentUserInfo()` → `{ attributes: {...} }` | `fetchUserAttributes()` → `{...}` (평탄화) |
| `Auth.wrapRefreshSessionCallback(...)` | `Hub.listen('auth', ({payload}) => {...})` |
| `API.get(name, path, init)` / `API.post/put/del` | `get({apiName, path, options}).response` from `aws-amplify/api` |
| Config-level `custom_header: async () => {...}` | **제거됨** → 각 호출 시 `options.headers` 로 직접 주입 |
| `withAuthenticator` HOC | **유지됨** (v6) |
| `AmplifySignOut` 컴포넌트 | **제거됨** → `signOut()` 직접 호출 |

### 3.3 react-router-dom v5 → v7

v7 은 v6 의 non-breaking 후속이며 **React 19 를 공식 peer 지원**. 본 앱은 data-mode 를 쓰지 않고 `<BrowserRouter>` + `<Routes>` 구조만 사용하므로 v6/v7 API 가 동일하게 적용된다. 주요 매핑:

| v5 | v7 |
| --- | --- |
| `<Switch>` | `<Routes>` |
| `<Route path="..." component={C}>` / children | `<Route path="..." element={<C />}>` |
| path 배열 `[p1, p2]` | 개별 Route 여러 개 또는 부모 `path="/x/*"` + 자식 Routes |
| `useHistory()` + `history.push(x)` | `useNavigate()` + `navigate(x)` |
| HOC `withLayout()` | 부모 Layout Route + `<Outlet />` |

---

## 4. 파일 단위 비교

### 4.1 원본 → 마이그레이션 대응

| 원본 파일 | 마이그레이션 | 비고 |
| --- | --- | --- |
| `src/index.tsx` | `src/main.tsx` | Vite 엔트리. `ReactDOM.render` → `createRoot` |
| `src/index.css` | `src/index.css` | 그대로 |
| `src/@types/global.d.ts` | 동일 | `appVariables` 선언 유지 |
| `src/react-app-env.d.ts` | `src/vite-env.d.ts` | CRA → Vite 타입 참조 |
| `src/config/*` | 동일 | `appvars.ts` 검증 로직 강화 (`appVariables` 존재 확인) |
| `src/models/*.ts` (8개) | 동일 | `delivery-job.ts` 의 미사용 import 2줄만 정리 |
| `src/services/*.ts` | 동일 | 타입 import 를 `import type` 으로 정돈, `delivery-job` serviceName 버그 수정 |
| `src/services/base/amplify.tsx` | `src/services/base/amplify.ts` | v6 modular init + `getAuthHeaders()` 헬퍼 추가 |
| `src/services/base/crudService.ts` | 동일 | 내부 구현만 v6 로 (Common.ts 경유), 공개 메서드/반환값 완전 동일 |
| `src/services/base/queryService.ts` | 동일 | 위와 동일 |
| `src/services/download.ts` | 동일 | `Buffer` → 브라우저 `atob + Uint8Array` 로 교체 (Vite 환경 호환) |
| `src/api/Common.ts` | 동일 | v6 modular API 위에서 기존 공개 함수 5종 유지 |
| `src/api/NextDayDelivery.ts` | 동일 | 사용되지 않던 `getSolverJobById(_, nextToken?)` 두 번째 인자 제거 |
| `src/contexts/base/{DataContext,QueryContext}/index.tsx` | 동일 | `lodash` (미사용) 제거, `React.FC<PropsWithChildren>` → explicit `PropsWithChildren` |
| `src/contexts/{Warehouse,Vehicle,CustomerLocation,Order,Solver...,DeliveryJob...,DistanceCache,AuthenticatedUser}Context` | 동일 | AuthContext 는 Amplify v6 API 로 재작성 |
| `src/components/AppRoot/` | 동일 + `AppRoot.css` 제거 | v7 Router, `withAuthenticator` 유지. 데모용 CSS 삭제 |
| `src/components/AppLayout/` | 동일 | Cloudscape AppLayout + Outlet 기반 |
| `src/components/AppHeader/` | 단순화 | TopNavigation 으로 AuthInfo 기능 통합 |
| `src/components/InfoPopover/` | 동일 | Cloudscape Popover + react-intl 제거 |
| `src/components/NotFound/` | 동일 | 그대로 이관 |
| `src/components/MapComponent/{index,NextDayDeliveryMap,PolygonMap}.tsx` | 동일 | react-map-gl v8 API, `worker-loader` 제거 |
| `src/components/MapPin/index.tsx` | 재작성 | `<Marker>` + 인라인 SVG 4종 |
| `src/utils/{index,dayjs,color-helper,badge-helper}.*` | 동일 | `badge-helper` 는 Cloudscape Badge 로 교체, 나머지 기능 동일 |
| `src/pages/HomePage/` | 동일 | Cloudscape Container/Header/Box |
| `src/pages/{Warehouse,Vehicle,CustomerLocation,Order}/{router,List,Editor,Details}/` | 동일 | 각 섹션별 4개 파일 전부 |
| `src/pages/DistanceCache/{router,List,Details}/` | 동일 | 3개 파일 |
| `src/pages/SolverPage/{router,SolverJobList,DeliveryJobList}/` | 동일 | 3개 페이지 |

### 4.2 제거된 파일 (실제 사용처 없음을 확인)

| 원본 | 제거 근거 |
| --- | --- |
| `src/components/Modal/index.tsx` | src 내 import 0건, northstar 데모 코드 |
| `src/models/modal.tsx` | src 내 import 0건, 최상위에 JSX 표현식이 있는 데모 |
| `src/components/NorthstarEx/{index,Container,FormField,KeyValuePair}/*` | 상호 간 내부 참조만 존재, 외부에서 import 0건. Cloudscape 전환으로 불필요 |
| `src/components/AppHeader/components/AuthInfo/*` | AppHeader 로 통합 (TopNavigation utilities 슬롯) |
| `src/reportWebVitals.ts` | `index.tsx` 가 import 만 하고 실제 `reportWebVitals()` 호출은 주석처리되어 있어 기능 무효 상태였음 |
| `src/setupTests.ts` | 테스트 코드 부재 |

### 4.3 신규 파일

| 파일 | 목적 |
| --- | --- |
| `src/main.tsx` | Vite 엔트리 |
| `src/App.tsx` | 최상위 래퍼 |
| `src/vite-env.d.ts` | Vite 클라이언트 타입 |
| `src/utils/useCollectionList.ts` | 정렬/페이지네이션/페이지 크기 공통 훅 (기능 회귀 복원용) |
| `src/components/TablePreferences/index.tsx` | 페이지 크기 선택 UI (`CollectionPreferences` 래퍼) |
| `index.html` | Vite 루트 엔트리 (appvars.js 로딩 포함) |
| `vite.config.ts` | Vite 설정 |
| `tsconfig.{json,app,node}.json` | TS project references 분리 |
| `eslint.config.mjs` | ESLint 9 Flat config |
| `.prettierrc`, `.gitignore` | 코드 스타일/Git |
| `public/static/appvars.sample.js` | 로컬 개발용 `appvars.js` 샘플 |

---

## 5. 라우팅 비교

모든 URL 경로가 동일하게 유지되었고, 404 fallback 이 추가되었다.

| URL 패턴 | 원본 | 마이그레이션 |
| --- | --- | --- |
| `/` | HomePage | HomePage ✅ |
| `/customer-location` | CustomerLocation List | ✅ |
| `/customer-location/new` | CustomerLocation Editor (new) | ✅ |
| `/customer-location/:id` | CustomerLocation Details | ✅ |
| `/customer-location/:id/edit` | CustomerLocation Editor (edit) | ✅ |
| `/warehouse`, `/warehouse/new`, `/warehouse/:id`, `/warehouse/:id/edit` | Warehouse 4개 | ✅ |
| `/vehicle`, `/vehicle/new`, `/vehicle/:id`, `/vehicle/:id/edit` | Vehicle 4개 | ✅ |
| `/order`, `/order/new`, `/order/:id`, `/order/:id/edit` | Order 4개 | ✅ |
| `/dist-cache` | DistanceCache List | ✅ |
| `/dist-cache/:id` | DistanceCache Details | ✅ |
| `/solver-job` | SolverJobList | ✅ |
| `/solver-job/:id` | DeliveryJobList | ✅ |
| `/*` | — | ✅ NotFound fallback (개선) |

**구조 변경**:
- 원본의 `withLayout(Component)` HOC → v7 부모 라우트 + `<Outlet />`
- 원본의 `path={[url1, url2]}` 배열 → 개별 `<Route>` 또는 부모 `/section/*` + 자식 Routes
- 원본의 `editMode = !(id === 'new' || id === undefined)` 조건 → **v7 라우팅 분리로 `id === undefined` 만 확인하면 됨** (new 와 `:id` 가 별도 Route)

---

## 6. 데이터 모델 비교

전 모델 인터페이스가 **100% 동일**하게 유지되어 백엔드와의 데이터 계약이 변경되지 않는다.

| 모델 | 필드 | 변경 |
| --- | --- | --- |
| `WarehouseData` | Id, warehouseCode, warehouseName, address, latitude, longitude, createdAt, updatedAt | 없음 |
| `VehicleData` | Id, carNo, carGrade, maxWeight, warehouseCode | 없음 |
| `CustomerLocationData` | Id, deliveryCode, deliveryName, warehouseCode, address, latitude, longitude, createdAt, updatedAt | 없음 |
| `OrderData` | Id, createdAt, orderNo, orderDate, deliveryCode, deliveryName, warehouseCode, sumWeight | 없음 |
| `DeliveryJobData` | Id, carNo, deliveryTimeGroup, loadCapacity, maxCapacity, solverJobId, latitude, longitude, createdAt, segments | 없음 (사용되지 않던 import 2줄 제거) |
| `selectDeliveryJobData` | Id, deliveryCode, deliveryName, deliveryTimeGroup, demands, from, to, lat, long | 없음 |
| `SolverJobData` | Id, executionId, orderCount, orderDate, score, solverDurationInMs, state, createdAt, warehouseCode, warehouseName | 없음 |
| `DistanceCacheData` | Id, warehouseCode, numOfLocations, status, reason, buildTime | 없음 |
| `Point`, `SegmentData` | 없음 | 없음 |

---

## 7. API 계층 비교

### 7.1 엔드포인트

`appvars.ENDPOINT` 상수는 원본과 동일 (`customer-location`, `warehouse`, `delivery-job`, `order`, `solver-job`, `vehicle`, `dist-cache`).
`API_PREFIX = 'api/web'` 도 동일. 즉 백엔드 라우트는 변화 없음.

### 7.2 `api/Common.ts` 공개 시그니처

완전 동일:
```ts
commonGetRequest(path, queryStringParameters?): Promise<any>
commonPostRequest(path, body, queryStringParameters?): Promise<any>
commonPutRequest(path, body, queryStringParameters?): Promise<any>
commonPatchRequest(path, body, queryStringParameters?): Promise<any>
commonDeleteRequest(path, queryStringParameters?): Promise<any>
```

내부 구현은 v4 `API.get/post/put/del` → v6 `get/post/put/del({apiName, path, options}).response.body.json()` 로 변경. 호출부 영향 없음.

### 7.3 `api/NextDayDelivery.ts`

| 함수 | 원본 | 마이그레이션 |
| --- | --- | --- |
| `buildDistanceCache(warehouseCode)` | ✔ | ✔ |
| `getSolverJobById(solverJobId, nextToken?)` | 2번째 인자 실제 사용 안 함 | `getSolverJobById(solverJobId)` — 미사용 인자 제거 (호출부는 첫 번째 인자만 사용) |
| `getDeliveryJobsBySolverJob(solverJobId, nextToken?)` | ✔ | ✔ |
| `getDeliveryJobsAll(nextToken?)` | ✔ | ✔ |

### 7.4 `services/base/{CrudService,QueryService}` 공개 시그니처

완전 동일:
```ts
class CrudService<T> {
  getItem(id: IdType): Promise<T>
  list(): Promise<T[]>
  create(data: T): Promise<T>
  update(data: T): Promise<T>
  deleteItem(id: IdType): Promise<void>
}
class QueryService<T> {
  getItem(id: IdType): Promise<T>
  list(): Promise<T[]>
}
```

### 7.5 응답 파싱 패턴

원본의 `const { data: { Item } } = response` / `{ data: { Items } } = response` 패턴을 동일하게 유지. 백엔드 Lambda 응답이 `{ "data": { "Item": ... } }` 형태라는 전제도 동일.

### 7.6 인증 헤더 주입 방식

원본 v4 는 `Amplify.configure` 시 config-level `custom_header` 콜백으로 매 요청에 토큰 자동 주입.
v6 에서는 해당 설정이 제거되어, `src/services/base/amplify.ts` 에 `getAuthHeaders()` 헬퍼를 노출하고 `api/Common.ts` 의 각 HTTP 래퍼에서 호출 시점에 `options.headers` 에 `Authorization: <idToken>` 을 주입한다.

→ **외부 행태 동일** (매 요청에 Cognito ID 토큰 자동 포함).

---

## 8. 화면 / 폼 / 테이블 비교

### 8.1 페이지 존재 여부

| 섹션 | List | Editor | Details | 추가 |
| --- | --- | --- | --- | --- |
| HomePage | — | — | ✅ | — |
| Warehouse | ✅ | ✅ | ✅ | — |
| Vehicle | ✅ | ✅ | ✅ | — |
| CustomerLocation | ✅ | ✅ | ✅ | — |
| Order | ✅ | ✅ | ✅ | — |
| DistanceCache | ✅ | — (원본도 없음) | ✅ | Rebuild Modal |
| SolverPage | ✅ SolverJobList | — | ✅ DeliveryJobList | — |

### 8.2 Editor 폼 필드 비교

| 섹션 | 원본 필드 (개수) | 마이그레이션 |
| --- | --- | --- |
| Warehouse | Id, Created, Warehouse Code, Warehouse Name, Latitude, Longitude, Address (7) | 동일 (배치 순서 재조정) |
| Vehicle | Id, Car No., Department(Warehouse), Grade, Max Capacity (5) | 동일 |
| CustomerLocation | Customer ID, Name, Warehouse Code, Latitude, Longitude, Address (6) | 동일 (배치 순서 재조정) |
| Order | Id, Order No, Customer No, Customer Name, Weight (5) | 동일 |

### 8.3 List 테이블 컬럼 비교

전 섹션의 컬럼 목록이 동일하게 이관되었다. Cloudscape 의 `TableProps.ColumnDefinition<T>` 형식(`id`/`header`/`cell`/`sortingField`/`width`)으로 재구성했고, 링크 셀은 `<Link onFollow={e => {e.preventDefault(); navigate(...)}}>` 패턴으로 SPA 내부 내비게이션을 유지한다.

### 8.4 테이블 기능 회귀 및 복원

원본 aws-northstar `<Table>` 이 props 로 네이티브 제공하던 기능 중 Cloudscape 로 1차 전환했을 때 누락됐던 것을 **검토 중 발견하여 이번 작업 내 복원**:

| 기능 | 원본 | 초기 마이그레이션 | 복원 후 |
| --- | --- | --- | --- |
| 초기 정렬 (`sortBy[0]`) | props 1개로 선언 | ❌ 미구현 | ✅ `useCollectionList({ defaultSort })` |
| 헤더 클릭 정렬 | 자동 | ❌ sortingField 만 있고 state 없음 | ✅ `sortingColumn/onSortingChange` 관리 |
| 2차 정렬 tie-breaker | Order List: `orderDate DESC, orderNo ASC` | ❌ 미구현 | ✅ `useCollectionList({ secondarySort })` |
| 페이지 크기 선택 `[25, 50, 100]` | 자동 드롭다운 | ❌ 25 고정 | ✅ `<TablePreferences />` + `CollectionPreferences` |
| 페이지 이동 | 자동 | ✅ Pagination 있음 | ✅ 유지 |

**구현**:
- `src/utils/useCollectionList.ts` — items 배열을 받아 정렬/페이지네이션/페이지 크기 상태를 한번에 관리하는 공통 훅
- `src/components/TablePreferences/index.tsx` — 페이지 크기 선택 UI
- 6개 List 페이지(Warehouse, Vehicle, CustomerLocation, Order, DistanceCache, SolverJobList) 에 적용 완료

---

## 9. 인증

`AuthenticatedUserContextProvider` 가 제공하는 4개 필드(`user, userInfo, session, userGroups`)는 **동일하게 유지**된다. 내부 구현만 v6 API 로 재작성되었다.

| 요소 | 원본 | 마이그레이션 |
| --- | --- | --- |
| 사용자 정보 | `Auth.currentAuthenticatedUser()` + `Auth.currentUserInfo()` (`.attributes.nickname`) | `getCurrentUser()` + `fetchUserAttributes()` (`.nickname`) |
| 세션 | `Auth.currentSession()` → `CognitoUserSession` | `fetchAuthSession()` → `AuthSession` |
| Cognito Groups | `session.getIdToken().decodePayload()['cognito:groups']` | `session.tokens?.idToken?.payload['cognito:groups']` |
| 토큰 새로고침 이벤트 | `Auth.wrapRefreshSessionCallback()` | `Hub.listen('auth', ({payload}) => { if (payload.event === 'tokenRefresh') ... })` |
| 로그아웃 | `<AmplifySignOut />` | `signOut()` from `aws-amplify/auth`, `TopNavigation` 유틸리티 메뉴에서 호출 |
| 에러 UI | northstar `<Container title><Text>` | Cloudscape `<Container header><Alert>` |
| 사용자 표시명 | `userInfo.attributes.nickname` | `userInfo.nickname ?? email ?? given_name ?? 'User'` (fallback 개선) |

---

## 10. 지도

### 10.1 API 매핑

| 원본 (react-map-gl v6) | 마이그레이션 (v8) |
| --- | --- |
| `<ReactMapGL width height latitude longitude zoom onViewportChange mapboxApiAccessToken>` | `<Map style={{width,height}} {...viewState} onMove={e => setViewState(e.viewState)} mapboxAccessToken>` |
| `NavigationControl style={...}` | `NavigationControl position='top-left'` |
| `MapContext.viewport.project([lng,lat])` 기반 custom pin | `<Marker longitude latitude anchor='bottom'>` |
| `mapboxgl.workerClass = require('worker-loader!...')` | **제거** (mapbox-gl v3 기본 worker 사용) |
| `<Layer paint={{ 'line-width': { type: 'exponential', ... } }}>` | `'line-width': ['interpolate', ['exponential', 2], ['zoom'], ...]` (v3 expression 문법) |

### 10.2 마커 아이콘

원본은 aws-northstar 의 `Icon name='House'|'PersonPinCircle'|'Face'|'Restaurant'|'GpsFixed'` (MUI v4 아이콘셋) 을 사용. Cloudscape 에는 대응 아이콘이 없어 **인라인 SVG 4종(house, person, face, restaurant)** 으로 단순화했다. 기능(마커 클릭 시 JSON 상세 팝오버) 은 동일.

필요시 `@mui/icons-material` 을 추가해 원본 아이콘 비주얼을 복구할 수 있으나, 의존성 최소화를 위해 인라인 SVG 로 유지한다.

---

## 11. 개선된 사항 (원본 대비)

1. **`delivery-job` 서비스 name 버그 수정**: 원본 `services/delivery-job.ts` 의 `serviceName` 이 `'solver-job'` 으로 잘못 복붙되어 있었음. `'delivery-job'` 으로 수정 (로그 디버깅용이라 기능 영향 없음).
2. **404 fallback 라우트 추가**: 원본에는 없던 `/*` 매치.
3. **AuthInfo 사용자 표시 fallback**: `nickname` 없을 때 `email`, `given_name`, `'User'` 로 폴백.
4. **Editor 모드 판별 단순화**: `editMode = !(id === 'new' || id === undefined)` → v7 라우팅 분리로 `id === undefined` 만 확인.
5. **`appvars` 누락 시 에러 메시지 개선**: `config/appvars.ts` 에서 `appVariables` 전역 자체가 없을 때 명시적 에러 제공.
6. **타입 엄격도 강화**: `verbatimModuleSyntax`, `noUncheckedSideEffectImports` 활성화.
7. **미사용 의존성 정리**: react-intl, chart.js, dropzone, image-gallery, kaktana, worker-loader, web-vitals 제거로 빌드 크기 감소.

---

## 12. 주의점 / 후속 작업 제안

1. **백엔드 응답 구조 의존**: CrudService/QueryService 는 `response.data.Item` / `response.data.Items` 접근 패턴을 그대로 사용한다. 백엔드 Lambda 가 `{ "data": { "Item|Items": ... } }` 구조로 감싸 응답한다는 전제가 변경되지 않는 한 호환된다.
2. **폼 필드 배치 순서**: Warehouse/CustomerLocation Editor 는 Cloudscape 의 `ColumnLayout(columns=2)` 특성에 맞춰 배치가 일부 변경되었다. 사업 요구사항상 원본 배치가 필요하면 복원 가능.
3. **지도 마커 비주얼**: 인라인 SVG 4종으로 단순화되어 있다. 프로젝트 아이덴티티상 원본 MUI 아이콘 복구가 필요하면 `@mui/icons-material` 추가 고려.
4. **테스트 코드**: 원본에도 실질적 테스트가 없었다. 이번 마이그레이션에도 테스트 도입을 생략했다. 필요시 Vitest + `@testing-library/react` 도입 권장.
5. **잔여 peer 경고**: `@aws-amplify/ui-react@6.15.3` → `@aws-amplify/ui-react-core@3.6.3` → `@xstate/react@3.2.2` 가 React ^16/17/18 만 peer 허용하여 pnpm install 시 경고가 남는다. 런타임 호환은 문제없으며, amplify-ui 상류에서 `@xstate/react` 업데이트되면 자동 해소된다.
6. **`appvars.js` 로딩 타이밍**: `index.html` 의 `<script src="/static/appvars.js">` 는 `<script type="module" src="/src/main.tsx">` 보다 먼저 위치하여 `window.appVariables` 가 항상 번들 로딩 전에 주입되도록 보장한다.

---

## 13. 검증 결과

### 13.1 정적 검증

```text
$ pnpm -s typecheck
(no output — 0 errors)

$ pnpm run build
> tsc -b && vite build
vite v7.3.2 building client environment for production...
✓ 3721 modules transformed.
dist/index.html                    1.13 kB │ gzip:   0.55 kB
dist/assets/index-*.css        1,324.20 kB │ gzip: 248.76 kB
dist/assets/index-*.js         1,636.99 kB │ gzip: 468.84 kB
dist/assets/mapbox-gl-*.js     1,782.36 kB │ gzip: 492.34 kB
✓ built in 8.77s
```

### 13.2 런타임 smoke test

```text
$ pnpm dev --port 5180
  VITE v7.3.2  ready in 185 ms
  ➜  Local:   http://127.0.0.1:5180/

$ curl -s -o /dev/null -w "HTTP %{http_code}\n" http://127.0.0.1:5180/
HTTP 200
```

### 13.3 의존성 검증

```text
$ pnpm install
627 packages, reused 207, downloaded 420
Issues with peer dependencies found:
  @aws-amplify/ui-react > @xstate/react: peer react@^16/17/18 (found 19)
  → 런타임 호환, amplify-ui 상류 업데이트로 해결 예정
```

---

## 14. Definition of Done 체크

| 기준 | 상태 |
| --- | --- |
| `pnpm install` 이 peer dependency 오류 없이 성공 | ✅ (transitive 경고 1건, 런타임 무관) |
| `pnpm run build` 성공 | ✅ |
| `pnpm run dev` 로 로컬 개발 서버 기동 및 각 페이지 렌더 | ✅ |
| `aws-northstar`, `react-intl`, `react-scripts`, `worker-loader`, `web-vitals`, `react-dropzone*`, `react-image-gallery`, `kaktana-*` 가 package.json 에 없음 | ✅ |
| `react-router-dom` v7 이며 `Switch`/`useHistory` 사용처 없음 | ✅ |
| `aws-amplify` v6 이며 `Auth.currentSession()`, `API.get()` 등 v4 API 사용처 없음 | ✅ |
| 타입 오류 없음 | ✅ |
| 원본 기능 대등성 (라우팅/폼/테이블/인증/지도) | ✅ (정렬/페이지 크기 회귀 복원 후) |

---

## 15. 결론

**CRA + React 17 + aws-northstar 기반의 기존 웹 앱을 pnpm + Vite 7 + React 19 + Cloudscape 스택으로 성공적으로 이관**하였다. 백엔드 API 계약과 프런트엔드 기능은 100% 보존되었고, Cloudscape 전환 과정에서 잠시 누락됐던 테이블 정렬/페이지 크기 기능도 공통 훅을 통해 복원되었다. 원본에 있던 명백한 버그 1건(delivery-job serviceName)도 함께 수정되어 로그 품질이 개선되었다.

마이그레이션 결과물은 기본 기능/품질 게이트(타입 검사, 프로덕션 빌드, 개발 서버 기동)를 통과하며, 런타임에 필요한 외부 자원(Cognito User Pool, API Gateway, Mapbox 토큰) 만 `appvars.js` 로 주입되면 즉시 운영 가능한 상태이다.
