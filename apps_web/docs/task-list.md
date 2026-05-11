# 마이그레이션 작업 체크리스트

본 문서는 `docs/migration-plan.md` 의 실행 계획을 세부 작업으로 분해한 것이다. 각 Phase 끝에서 `pnpm -s run typecheck && pnpm -s run build` 를 돌려 회귀를 조기에 잡는다.

---

## Phase 1 — 프로젝트 골격 (Vite + pnpm + TS + React 19)

- [x] `package.json` 생성
  - name: `@apps/web`, private, type=module
  - scripts: `dev`, `build`, `preview`, `typecheck`, `lint`, `format`
  - dependencies / devDependencies는 `migration-plan.md` §3 기준
- [x] `pnpm-lock.yaml` 생성 (`pnpm install`)
- [x] `vite.config.ts` (`@vitejs/plugin-react`, `resolve.alias`, `server.port=3000`, `define`)
- [x] `tsconfig.json` (React 19, moduleResolution=bundler, jsx=react-jsx, strict, paths)
- [x] `tsconfig.node.json` (vite.config.ts 용)
- [x] 루트 `index.html` (Vite 엔트리, `<script src="/static/appvars.js">` 포함, `%PUBLIC_URL%` 제거)
- [x] `src/main.tsx` (createRoot + StrictMode + App)
- [x] `src/App.tsx` (원본 AppRoot 이관 지점, 초기엔 placeholder)
- [x] `src/vite-env.d.ts`
- [x] `src/@types/global.d.ts` 복사 (`appVariables` declare)
- [x] `src/index.css` 복사
- [x] `.gitignore` (Vite 기준)
- [x] `.prettierrc`, `.editorconfig`(선택)
- [x] ESLint 9 flat config — `eslint.config.mjs`
- [x] 검증: `pnpm -s typecheck`, `pnpm -s build` (empty App이라도 성공)

## Phase 2 — 외부 의존성 래퍼 (Amplify v6, 서비스 계층)

- [x] `src/config/appvars.ts` 원본 이관 (변경 불필요, 값 읽기 방식 유지)
- [x] `src/config/index.ts` 이관
- [x] `src/services/base/amplify.tsx` → v6 초기화로 재작성
  - `Amplify.configure({ Auth: { Cognito: {...} }, API: { REST: {...} } })`
  - `custom_header` 에서 `fetchAuthSession()` 사용
- [x] `src/api/Common.ts` 재작성
  - `get/post/put/del` from `aws-amplify/api`
  - 기존 함수 시그니처 (`commonGetRequest` 등) 유지 → 호출부 영향 최소화
  - `response.body.json()` 으로 JSON 파싱
- [x] `src/services/base/crudService.ts`, `queryService.ts` 재작성
  - `API.get/post/put/del` → modular function 호출
- [x] `src/services/download.ts` 재작성 — Blob 다운로드 흐름은 유지, API 호출만 v6 로
- [x] 각 `src/services/*.ts` (warehouse/customer-location/order/vehicle/delivery-job/solver-job/distance-cache) 이관 (대부분 base wrapper만 사용하므로 수정 불필요)
- [x] `src/contexts/AuthenticatedUserContext/AuthenticatedUserContext.tsx` 재작성
  - `getCurrentUser`, `fetchUserAttributes`, `fetchAuthSession` 로 교체
  - token refresh는 `Hub.listen('auth', ...)` 로 대체
  - UI 부분(`Container`/`Text`)은 Cloudscape로
- [x] 검증: `tsc --noEmit` 통과

## Phase 3 — 라우팅 (react-router-dom v5 → v7)

- [x] `src/components/AppRoot/index.tsx` 재작성
  - `BrowserRouter` + `Routes` + `Route element={<C />}`
  - `withLayout` HOC → 부모 Layout Route 패턴으로 변경
  - `withAuthenticator` v6로 교체
- [x] 각 섹션 `router/index.tsx` 업데이트 (Warehouse, Vehicle, Order, CustomerLocation, DistanceCache, SolverPage)
  - `Switch` → `Routes`
  - path array → 개별 Route
  - context provider 감싸기 유지
- [x] 페이지별 네비게이션 훅 교체
  - `useHistory()` → `useNavigate()`
  - `history.push(x)` → `navigate(x)`
- [x] `useParams<{id: string}>()` → v7에서도 제네릭 허용 (필요시 타입 단언)
- [x] `Link` 사용처: Cloudscape `Link` 로 교체하면서 내부 이동은 `onFollow` 콜백에서 `event.preventDefault()` + `navigate(to)` 패턴
- [x] 검증: 로컬 dev 기동 후 각 경로 진입 확인 (테스트 데이터 없이도 라우팅 동작은 확인 가능)

## Phase 4 — 앱 레이아웃 (Northstar → Cloudscape)

- [x] `@cloudscape-design/global-styles/index.css` 를 `main.tsx` 에서 import
- [x] `src/components/AppLayout/index.tsx` 재작성
  - `AppLayout` + `SideNavigation` + `BreadcrumbGroup` (Cloudscape)
  - 메뉴 아이템을 Cloudscape 형식(`{ type: 'link', text, href }`, `{ type: 'divider' }`)으로 변환
  - BreadcrumbGroup은 현재 위치를 기반으로 자동 구성 (우선 간단한 홈/섹션 수준)
- [x] `src/components/AppHeader/index.tsx` → `TopNavigation` 사용
- [x] `src/components/AppHeader/components/AuthInfo/AuthInfo.tsx`
  - `AmplifySignOut` 제거
  - `signOut` 은 `aws-amplify/auth` 의 `signOut` 함수 사용
  - UI는 `TopNavigation` 의 utilities 슬롯에 통합하면 별도 컴포넌트 불필요할 수 있음 → 통합 방향으로 리팩터링

## Phase 5 — 페이지 컴포넌트 치환

페이지는 모두 List/Details/Editor 패턴이 거의 동일하다. 순서:

- [x] `pages/HomePage/index.tsx` (간단, Container+Box+Link만 사용)
- [x] `pages/Warehouse/List/index.tsx` + `table-columns.tsx`
- [x] `pages/Warehouse/Editor/index.tsx`
- [x] `pages/Warehouse/Details/index.tsx`
- [x] 동일 패턴으로 Vehicle/CustomerLocation/Order/DistanceCache/SolverPage 이관
  - Table: Cloudscape `Table` columnDefinitions 구조 (`id`, `header`, `cell`, `sortingField`) 로 변환
  - Form: `Form` + `FormField` + `Input` (Cloudscape의 `onChange` 는 `({detail}) => ...` 사용)
  - `DeleteConfirmationDialog` → `Modal` + 푸터 Cancel/Delete 버튼 조합
  - `ButtonIcon type="refresh"` → `Button iconName="refresh"` variant="icon"
  - `Inline`/`Stack`/`ColumnLayout`/`Column` → `SpaceBetween`/`ColumnLayout`
- [x] `src/utils/badge-helper.tsx` → Cloudscape `Badge` 기준으로 매핑 (color 값 확인)
- [x] `src/models/modal.tsx` 제거 또는 Cloudscape Modal 래퍼로 축소
- [x] `src/components/Modal/index.tsx` 삭제 또는 Cloudscape Modal wrapper로 교체
- [x] `src/components/NotFound/index.tsx` 이관 (매우 단순)
- [x] `src/components/NorthstarEx/*` 재평가: Cloudscape `Container`/`FormField`/`KeyValuePair` 로 흡수되어 별도 래퍼 불필요 → **폴더째 삭제 후 호출부를 직접 Cloudscape로 변경**

## Phase 6 — 지도 (react-map-gl v8 + mapbox-gl v3)

- [x] `components/MapComponent/index.tsx` v8로 재작성
  - `<Map mapboxAccessToken={...} initialViewState={...} style={{width, height}} mapStyle="mapbox://styles/mapbox/streets-v11" onMove={e => setViewState(e.viewState)}>`
  - `NavigationControl` props 업데이트 (`position="top-left"`)
  - `<Source>` / `<Layer>` 의 children 대신 `<Layer source={id} .../>` 등 Layer 명세 조정
  - `worker-loader` 라인 **제거**
- [x] `components/MapComponent/NextDayDeliveryMap.tsx` 동일 방식으로 재작성
- [x] `components/MapComponent/PolygonMap.tsx` 재작성
- [x] `components/MapPin/index.tsx` 재작성
  - `MapContext` 제거, `<Marker longitude latitude anchor="bottom">` 사용
  - Popover은 Cloudscape `Popover` 로, 마커 children 안에 trigger 두기
  - MarkdownViewer → `react-markdown` 사용
  - Northstar `Icon` → 인라인 SVG 또는 `@mui/icons-material`(경량) 중 선택 (최종 결정: 지도 아이콘은 인라인 SVG 4-5개로 만들어 의존성 최소화)
- [x] 검증: 지도 토큰이 있을 때 로컬에서 경로/마커 렌더링 확인

## Phase 7 — 정리 및 부가 작업

- [x] `src/components/InfoPopover/index.tsx`
  - `FormattedMessage` 제거 → `infoHeader ?? infoKey` 직접 출력
  - Cloudscape `Popover` + 작은 info `Icon` 조합으로 단순화
- [x] `src/utils/dayjs.ts`, `src/utils/color-helper.ts`, `src/utils/index.ts` 이관 (변경 불필요, 타입만 확인)
- [x] `src/contexts/base/*`, `src/contexts/*/index.tsx` 이관
  - `React.FC` 의 `children` 제네릭 이슈: React 18+에서 `FC` 는 더 이상 children을 암시적으로 포함하지 않음 → `PropsWithChildren` 사용
- [x] `src/reportWebVitals.ts` 삭제
- [x] `src/setupTests.ts` 삭제 (테스트 도입 전까지 불필요)
- [x] `src/react-app-env.d.ts` 삭제 (vite-env.d.ts 대체)
- [x] public 자산 복사: `favicon/`, `manifest.json`, `robots.txt`
- [x] `public/static/appvars.sample.js` 선택적 추가로 로컬 빈 배포에서도 개발 가능하도록 (실제 appvars.js는 .gitignore)

## Phase 8 — 검증 및 마무리

- [x] `pnpm install` 의존성 충돌 없음 확인 (특히 React 19 peer)
- [x] `pnpm run typecheck` 통과
- [x] `pnpm run build` 통과 (프로덕션 번들 생성 확인)
- [x] `pnpm run dev` 기동 확인
  - `/` → Home
  - 사이드 메뉴로 각 섹션 이동 → 라우팅 OK
  - appvars.js 미존재 시 명확한 에러 메시지
- [x] README.md 업데이트 (스택/스크립트/환경변수 안내)
- [x] 제거할 것: 빈 테스트 러너 설정, 불필요 .eslintrc 파일

---

## 산출물 기준(Definition of Done)

1. `pnpm install` 이 peer dependency 오류 없이 성공한다.
2. `pnpm run build` 가 오류 없이 성공하여 `dist/` 를 생성한다.
3. `pnpm run dev` 로 로컬 개발 서버가 뜨고, 각 페이지가 React 19 + Cloudscape로 렌더된다.
4. `aws-northstar`, `react-intl`, `react-scripts`, `worker-loader`, `web-vitals`, `react-dropzone*`, `react-image-gallery`, `kaktana-*` 패키지가 `package.json` 에 존재하지 않는다.
5. `react-router-dom` 버전이 7.x 이며 `Switch`/`useHistory` 가 코드에 남아있지 않다.
6. `aws-amplify` 버전이 6.x 이며 `Auth.currentSession()`, `API.get()` 등 v4 API가 남아있지 않다.
7. 타입 오류가 없으며, 빌드시 React 19 관련 경고가 critical 수준으로 남아있지 않다.
