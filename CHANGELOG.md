# Change log
Change log for optimizing delivery route and order dispatching sample

## ver. 2.0.0
### Features
* migrated project layout into three self-contained workspaces: `apps_opt_engine`, `apps_web`, `apps_infra`
* replaced top-level lerna + yarn-workspace monorepo with independent pnpm / Gradle projects

### Optimization Engine (`apps_opt_engine`)
* migrated from Quarkus 2.x (Maven multi-module) to **Spring Boot 3.5 + Gradle 8.x (Kotlin DSL) on JDK 21**
* replaced `javax.*` APIs with `jakarta.*` for Spring Boot 3.x / OptaPlanner 9+ compatibility
* upgraded OptaPlanner to **10.2.0** (retained solver-config.xml, Constraint Streams, HardMediumSoftLongScore)
* upgraded GraphHopper to **11.0** (removed deprecated `CarFlagEncoder`/`FlagEncoderFactory`, profile registration by name)
* replaced SmallRye Health with Spring Actuator + custom `GraphHopperHealthIndicator`
* replaced Quarkus `%dev`/`%test` profiles with Spring `application-dev.properties` / `application-test.properties`
* upgraded AWS SDK v2 BOM to **2.42.19**
* introduced `build_opt_engine.sh` that auto-downloads the OSM PBF from Geofabrik when missing and packages two deployable ECS artifacts (`distancecache-util`, `nextday-delivery`)

### Web App (`apps_web`)
* migrated from Create React App + yarn to **Vite 7 + pnpm** on **Node.js 20+**
* upgraded React **17 → 19** and TypeScript **4.x → 5.7**
* replaced `aws-northstar` UI with **Cloudscape Design System 3**
* upgraded `aws-amplify` **4 → 6** (modular imports, `fetchAuthSession`-based auth headers)
* upgraded `react-router-dom` **5 → 7** (replaced `Switch`/`useHistory` with `Routes`/`useNavigate`)
* upgraded `react-map-gl` **6 → 8** and switched from Mapbox GL JS to **MapLibre GL JS v5 + OpenFreeMap**, eliminating the `MAPBOX_TOKEN` runtime dependency
* removed unused legacy dependencies (`react-intl`, `chart.js`, `react-chartjs-2`, `react-dropzone`, `react-dropzone-uploader`, `react-image-gallery`, `kaktana-react-lightweight-charts`, `worker-loader`, `web-vitals`, `react-scripts`)
* flat-config ESLint 9 + Prettier 3 integration

### Infrastructure (`apps_infra`)
* migrated from lerna + yarn-workspace monorepo (8 `@infra/*` packages) to a **single self-contained pnpm package**
* upgraded AWS CDK to **2.252** and TypeScript to **5.6**; upgraded Lambda runtime to **Node.js 24**
* migrated AWS SDK **v2 → v3** (modular clients) in Lambda handlers
* introduced **Zod-based config schema validation** on `config/default.yml` with environment variable overrides (`CDK_DEFAULT_ACCOUNT`, `CDK_DEFAULT_REGION`, `ADMINISTRATOR_EMAIL`)
* reorganized stacks into a clear dependency graph: `PersistentBackendStack` → (`BackendStack`, `OrderUploadStack`, `DistanceCacheStack`, `OptimizationEngineStack`)
* added Jest-based CDK unit / integration tests and `cfn-nag` security review task

### Documentation & Governance
* added `docs/quickstart.md` covering requirements, AWS credential setup, build/deploy order, and teardown
* added `docs/architecture.md` and bundled architecture/demo images under `docs/imgs/`
* updated `LICENSE_THIRDPARTY.txt` to reflect the actual dependency graph of the migrated codebase

## ver. 1.0.0
### Features
* order dispatch and delivery route optimization with a warehouse
* route belong real road
* time window by the order
* various vehicle types
* business constraints
