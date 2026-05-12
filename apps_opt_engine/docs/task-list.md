# opt-engine 마이그레이션 작업 목록

각 태스크에는 체크박스, 대상 파일/경로, 검증 기준을 명시했습니다. `docs/migration-plan.md`의 섹션과 연결됩니다.

## S0. 프로젝트 스켈레톤 (Gradle 멀티모듈)

- [ ] **S0-1** 루트 `.gitignore` 작성 (build/, .gradle/, *.iml, .idea/, out/, logs/)
- [ ] **S0-2** `settings.gradle.kts` — rootProject.name="opt-engine", 5개 모듈 include
- [ ] **S0-3** `gradle.properties` — org.gradle.jvmargs, java.toolchain.autoProvision 등
- [ ] **S0-4** 루트 `build.gradle.kts` — plugins(apply false), subprojects 공통(java-library, Java 21 toolchain, lombok, repositories, test)
- [ ] **S0-5** Gradle Wrapper 생성 (8.10+) — gradlew, gradlew.bat, gradle/wrapper/
- [ ] **S0-6** `buildSrc/` 또는 `gradle/libs.versions.toml`에 버전 카탈로그(선택)
- [ ] **S0-7** 각 모듈 디렉토리 생성 + 비어있는 `build.gradle.kts` 플레이스홀더
- [ ] **S0-8** README.md 최상위 — 프로젝트 개요, 빌드/실행 커맨드

**검증**: `./gradlew projects` 가 모든 5개 subproject를 나열.

## S1. `core:core-impl` 마이그레이션 (AWS SDK 유틸)

원본: `core/core-impl/src/main/java/dev/aws/proto/core/*`

- [ ] **S1-1** `build.gradle.kts` 작성 — java-library, aws-sdk BOM 2.42.19, dynamodb/s3/secretsmanager/ssm/sts, jackson-databind
- [ ] **S1-2** 소스 복사: `Order.java`, `exception/DispatcherException.java`
- [ ] **S1-3** 소스 복사: `util/PathHelper.java`
- [ ] **S1-4** 소스 복사: `util/aws/CredentialsHelper.java` — `javax.enterprise.context.Dependent` 등 제거(본래도 static 유틸)
- [ ] **S1-5** 소스 복사: `util/aws/DdbUtility.java`, `S3Utility.java`, `SsmUtility.java`, `SecretsManagerUtility.java`
- [ ] **S1-6** 컴파일 성공 확인: `./gradlew :core:core-impl:compileJava`
- [ ] **S1-7** (선택) `application.properties`는 본 모듈에 불필요하므로 제거

**검증**: `:core:core-impl:build` 성공.

## S2. `core:routing` 마이그레이션

원본: `core/routing/src/main/java/dev/aws/proto/core/routing/*`

- [ ] **S2-1** `build.gradle.kts` 작성 — java-library, graphhopper-core 11, mapbox-sdk-geojson 5.8.0, jackson-databind, lombok. `api project(":core:core-impl")`
- [ ] **S2-2** 소스 복사: `exception/`, `location/`, `distance/` (POJO/인터페이스, 대부분 변경 없음)
- [ ] **S2-3** 소스 복사: `route/PolylineHelper.java` (Mapbox API 호출 확인)
- [ ] **S2-4** 소스 복사 + 수정: `route/GraphhopperLoader.java` — GraphHopper 11 API 적응 (`importOrLoad`, `setOSMFile`, `setGraphHopperLocation`, `setProfiles(Profile)`)
- [ ] **S2-5** 소스 복사 + 수정: `route/GraphhopperRouter.java` — `GHRequest`/`GHResponse`/`ResponsePath`/`setProfile(...)` API 적응
- [ ] **S2-6** 소스 복사: `route/SegmentRoute.java`
- [ ] **S2-7** **변환**: `config/RoutingProperties.java` (Quarkus @ConfigProperty interface) → Java record + `@ConfigurationProperties(prefix="app.routing")`
- [ ] **S2-8** **변환**: `config/RoutingConfig.java` — `@ApplicationScoped` → `@Configuration`, `@Inject` → 생성자 주입. `GraphHopper` 빈 노출.
- [ ] **S2-9** 소스 복사: `cache/persistence/ICachePersistence.java`, `MemDbPersistence.java`, `CachePersistenceException.java`
- [ ] **S2-10** 소스 복사: `cache/persistence/latlong/FilePersistence.java`, `S3FilePersistence.java` (AWS SDK만 사용, Quarkus 의존 없음)
- [ ] **S2-11** 컴파일 성공: `./gradlew :core:routing:compileJava`

**검증**: `:core:routing:build` 성공. GraphHopper API 호환 확인.

## S3. `apps:app-core` 마이그레이션 (Spring 공통)

원본: `apps/app-core/src/main/java/dev/aws/proto/apps/appcore/*`

- [ ] **S3-1** `build.gradle.kts` — java-library, `api project(":core:routing")`, spring-boot-starter-web(api), spring-boot-starter-actuator, optaplanner-core, aws-sdk2-dynamo-json-helper, lombok. `io.spring.dependency-management` 적용.
- [ ] **S3-2** **변환**: `config/SolutionProperties.java` (interface) → record + `@ConfigurationProperties(prefix="optaplanner.solver")`
- [ ] **S3-3** **변환**: `config/DistanceCachingProperties.java` → record + `@ConfigurationProperties(prefix="app.routing.cache")`
- [ ] **S3-4** **변환**: `config/SolutionConfig.java` — `@ApplicationScoped` → `@Configuration`, solver-config.xml 경로 탐색 로직 보존
- [ ] **S3-5** **변환**: `api/DispatchService.java` (추상 클래스) — `@Inject` 필드 → protected + 생성자 주입(서브클래스에서 주입 전달). OptaPlanner import 유지.
- [ ] **S3-6** 소스 복사: `api/request/DispatchRequest.java`, `api/response/{DispatchResult,RequestResult,Segment,DeliverySegment,UnitValue}.java`
- [ ] **S3-7** **삭제**: `api/DispatchResource.java` (빈 placeholder)
- [ ] **S3-8** **삭제**: `api/health/LivenessResource.java`, `ReadinessCheckResource.java` → Actuator 사용 (`application.properties`에 `management.endpoints.web.exposure.include=health,info`)
- [ ] **S3-9** 소스 복사: `planner/solution/{DispatchSolutionBase,SolutionState,SolutionStatus}.java`
- [ ] **S3-10** **변환**: `data/DdbServiceBase.java` — 추상 클래스, `@Inject` 없음, 거의 그대로 복사
- [ ] **S3-11** `beans.xml` 제거
- [ ] **S3-12** 컴파일 성공: `./gradlew :apps:app-core:compileJava`

**검증**: `:apps:app-core:build` 성공.

## S4. `apps:nextday-delivery` 마이그레이션 (Spring Boot 메인 앱)

원본: `apps/nextday-delivery/src/main/java/dev/aws/proto/apps/nextday/*`

- [ ] **S4-1** `build.gradle.kts` — `org.springframework.boot`, `io.spring.dependency-management`, `implementation project(":apps:app-core")`, `optaplanner-spring-boot-starter` 또는 `optaplanner-core`, `spring-boot-starter-web`, `spring-boot-starter-actuator`, `spring-boot-starter-validation`. bootJar archiveFileName = "delivery-dispatch.jar". solver-config.xml 복사 태스크(참고 프로젝트 패턴).
- [ ] **S4-2** **신규**: `OptEngineApplication.java` (`@SpringBootApplication`, main + `SpringApplication.run(...)`)
- [ ] **S4-3** **변환**: `api/AppLifecycleMain.java` — `StartupEvent/ShutdownEvent` → `@Component` + `@EventListener(ApplicationReadyEvent.class)` / `@PreDestroy`. 스레드 실행 로직 유지. `@Inject DispatchResource resource` → 생성자 주입 `DispatchController`.
- [ ] **S4-4** **변환**: `api/DispatchResource.java` → `api/DispatchController.java`. `@Path("/opt-engine")` → `@RestController @RequestMapping("/opt-engine")`. `@POST @Path("solve")` → `@PostMapping("/solve")`. `@GET @Path("status/{id}")` → `@GetMapping("/status/{id}")`. `@PathParam` → `@PathVariable`. `DispatchRequest` body → `@RequestBody`.
- [ ] **S4-5** **변환**: `api/DispatchService.java` — `@ApplicationScoped` → `@Service`, `@Inject` 필드 → 생성자 주입. `RoutingConfig`/`SolutionConfig`/`DistanceCachingConfig` 주입. `SolverManager` 자체 생성 로직 유지.
- [ ] **S4-6** 소스 복사: `api/request/DispatchRequest.java`, `api/response/{DeliveryJob,SolverJob,SolverJobWithDeliveryJobs}.java`
- [ ] **S4-7** **변환**: `config/DistanceCachingConfig.java` — `@ApplicationScoped` → `@Configuration`. `NotSupportedException`(javax.ws.rs) → `UnsupportedOperationException`.
- [ ] **S4-8** **변환**: `config/DdbProperties.java` — interface → record + `@ConfigurationProperties(prefix="app.ssmparams.ddb")`
- [ ] **S4-9** **변환**: `config/DispatchOrderConfig.java` — `@ConfigProperty` → `@Value` 또는 `@ConfigurationProperties(prefix="app.dispatch.config")`
- [ ] **S4-10** 소스 복사: `util/Constants.java`
- [ ] **S4-11** 소스 복사: `location/{Location,HubLocation,DropoffLocation,DriverLocation,PickupLocation}.java` (OptaPlanner 어노테이션 유지)
- [ ] **S4-12** 소스 복사: `domain/planning/*` (전 파일, OptaPlanner 어노테이션 유지: PlanningEntity, PlanningVariable, PlanningId, InverseRelationShadowVariable, DeepPlanningClone, VariableListener, PlanningBase 등). `capacity/`, `builder/`, `solver/` 하위도 그대로.
- [ ] **S4-13** 소스 복사: `planner/solution/{DispatchSolution,DispatchConstraintProvider,SolutionConsumer}.java` (OptaPlanner 어노테이션 유지)
- [ ] **S4-14** **변환**: `data/Ddb{Hub,Vehicle,Order,DeliveryJob,SolverJob,CustomerLocation}Service.java` — `@ApplicationScoped` → `@Service`, `@Inject` → 생성자 주입. AWS DDB 로직 그대로.
- [ ] **S4-15** **변환**: `application.properties` — Quarkus → Spring Boot 포맷. `%dev.` → `application-dev.properties`. `%test.` → `application-test.properties`. CORS/압축/로그 매핑 적용.
- [ ] **S4-16** `resources/solver-config.xml` 복사 (namespace 확인)
- [ ] **S4-17** `resources/META-INF/beans.xml` 제거
- [ ] **S4-18** `resources/logback-spring.xml` 추가 (console 패턴 기존 유지)
- [ ] **S4-19** 컴파일 + bootJar: `./gradlew :apps:nextday-delivery:bootJar`

**검증**: `:apps:nextday-delivery:build` 성공, bootJar 생성.

## S5. `apps:distancecache-util` 마이그레이션 (picocli CLI)

원본: `apps/distancecache-util/src/main/java/dev/aws/proto/apps/distancecache/util/*`

- [ ] **S5-1** `build.gradle.kts` — `application` + `com.gradleup.shadow` 플러그인. mainClass = `dev.aws.proto.apps.distancecache.util.App`. 의존: `implementation project(":core:routing")`, picocli 4.7.6, opencsv 5.11, logback-classic, aws-sdk(dynamodb). shadowJar archiveBaseName = "distance-cache-util".
- [ ] **S5-2** 소스 복사: `App.java`
- [ ] **S5-3** 소스 복사: `commands/{BuildLatLongCache,ImportLatLongCache}.java`
- [ ] **S5-4** 소스 복사: `loader/LocationLoader.java`
- [ ] **S5-5** 소스 복사: `data/DdbDistanceCacheBuilderService.java`
- [ ] **S5-6** `resources/logback.xml` 이식
- [ ] **S5-7** 기존 스크립트 이식: `scripts/` 하위 `init_cache_env.sh`, `dev-build-lat-long-*.sh`
- [ ] **S5-8** 빌드: `./gradlew :apps:distancecache-util:shadowJar`

**검증**: `:apps:distancecache-util:shadowJar` 성공, 실행 시 `--help` 출력.

## S6. 빌드·검증

- [ ] **S6-1** 전체 빌드: `./gradlew clean build` 전체 통과
- [ ] **S6-2** nextday-delivery bootRun 기동 확인: `./gradlew :apps:nextday-delivery:bootRun --args='--spring.profiles.active=dev'` (AWS 미연결 시 에러는 허용, Spring Context 로드까지 확인)
- [ ] **S6-3** Actuator health 확인: `curl http://localhost:8888/actuator/health`
- [ ] **S6-4** REST 컨트롤러 매핑 확인: `curl -X POST http://localhost:8888/opt-engine/solve -H 'Content-Type: application/json' -d '{}'` (400 or 500은 허용, 엔드포인트 매핑만 확인)
- [ ] **S6-5** distance-cache-util 실행: `java -jar apps/distancecache-util/build/libs/distance-cache-util.jar --help`
- [ ] **S6-6** 간단한 smoke test 작성 (`ApplicationContext` 로드, bean wiring)

## S7. 마무리 및 문서화

- [ ] **S7-1** README.md 업데이트 — 요구사항(Java 21), 빌드/실행/테스트 방법, 프로파일, 환경변수
- [ ] **S7-2** `scripts/Dockerfile.nextdaydelivery` Spring Boot용 업데이트 (amazoncorretto:21, bootJar entrypoint)
- [ ] **S7-3** `scripts/Dockerfile.distancecache` 업데이트
- [ ] **S7-4** 빌드 스크립트 `build_opt_engine.sh` 이식(Gradle 기반)
- [ ] **S7-5** CHANGELOG / 마이그레이션 결과 요약 (docs/migration-result.md 선택)

---

## 파일별 변환 빠른 참조표

| 원본 파일 | 변환 유형 | 대상 위치 |
|---|---|---|
| `core/core-impl/src/.../Order.java` | 복사 | `core/core-impl/src/main/java/dev/aws/proto/core/Order.java` |
| `core/core-impl/src/.../util/aws/*.java` (5개) | 복사 | `core/core-impl/src/main/java/dev/aws/proto/core/util/aws/` |
| `core/core-impl/src/.../util/PathHelper.java` | 복사 | 동일 |
| `core/core-impl/src/.../exception/DispatcherException.java` | 복사 | 동일 |
| `core/routing/src/.../location/*.java` (5개) | 복사 | 동일 경로 |
| `core/routing/src/.../distance/*.java` (5개) | 복사 | 동일 경로 |
| `core/routing/src/.../exception/*.java` (2개) | 복사 | 동일 경로 |
| `core/routing/src/.../route/SegmentRoute.java` | 복사 | 동일 |
| `core/routing/src/.../route/PolylineHelper.java` | 복사 (Mapbox 유지) | 동일 |
| `core/routing/src/.../route/GraphhopperLoader.java` | **수정** (GH 11 API) | 동일 |
| `core/routing/src/.../route/GraphhopperRouter.java` | **수정** (GH 11 API) | 동일 |
| `core/routing/src/.../config/RoutingProperties.java` | **변환** (interface → record @ConfigurationProperties) | 동일 |
| `core/routing/src/.../config/RoutingConfig.java` | **변환** (@Configuration) | 동일 |
| `core/routing/src/.../cache/persistence/*.java` (3개) | 복사 | 동일 |
| `core/routing/src/.../cache/persistence/latlong/*.java` (2개) | 복사 | 동일 |
| `apps/app-core/src/.../config/SolutionProperties.java` | **변환** | 동일 |
| `apps/app-core/src/.../config/SolutionConfig.java` | **변환** (@Configuration) | 동일 |
| `apps/app-core/src/.../config/DistanceCachingProperties.java` | **변환** | 동일 |
| `apps/app-core/src/.../api/DispatchService.java` | **변환** (생성자주입, abstract) | 동일 |
| `apps/app-core/src/.../api/DispatchResource.java` (빈 placeholder) | **삭제** | — |
| `apps/app-core/src/.../api/health/*.java` (2개) | **삭제** → Actuator | — |
| `apps/app-core/src/.../api/request|response/*.java` | 복사 | 동일 |
| `apps/app-core/src/.../planner/solution/*.java` (3개) | 복사 | 동일 |
| `apps/app-core/src/.../data/DdbServiceBase.java` | 복사 (일부 정리) | 동일 |
| `apps/app-core/src/main/resources/META-INF/beans.xml` | **삭제** | — |
| `apps/nextday-delivery/src/.../api/AppLifecycleMain.java` | **변환** (ApplicationReadyEvent) | 동일 |
| `apps/nextday-delivery/src/.../api/DispatchResource.java` | **변환** → `DispatchController.java` | `api/DispatchController.java` |
| `apps/nextday-delivery/src/.../api/DispatchService.java` | **변환** (@Service, 생성자주입) | 동일 |
| `apps/nextday-delivery/src/.../api/request|response/*.java` (4개) | 복사 | 동일 |
| `apps/nextday-delivery/src/.../data/Ddb*Service.java` (6개) | **변환** (@Service, 생성자주입) | 동일 |
| `apps/nextday-delivery/src/.../config/DispatchOrderConfig.java` | **변환** | 동일 |
| `apps/nextday-delivery/src/.../config/DistanceCachingConfig.java` | **변환** | 동일 |
| `apps/nextday-delivery/src/.../config/DdbProperties.java` | **변환** | 동일 |
| `apps/nextday-delivery/src/.../domain/planning/**/*.java` | 복사 (OptaPlanner 유지) | 동일 |
| `apps/nextday-delivery/src/.../location/*.java` (5개) | 복사 | 동일 |
| `apps/nextday-delivery/src/.../planner/solution/*.java` (3개) | 복사 | 동일 |
| `apps/nextday-delivery/src/.../util/Constants.java` | 복사 | 동일 |
| `apps/nextday-delivery/src/.../package-info.java` | 복사 | 동일 |
| `apps/nextday-delivery/src/main/resources/application.properties` | **변환** | Spring Boot 포맷 |
| `apps/nextday-delivery/src/main/resources/solver-config.xml` | 복사 (namespace 확인) | 동일 |
| `apps/nextday-delivery/src/main/resources/META-INF/beans.xml` | **삭제** | — |
| `apps/distancecache-util/src/.../*.java` (5개) | 복사 | 동일 |
| `apps/distancecache-util/src/main/resources/logback.xml` | 복사 | 동일 |
| `scripts/Dockerfile.*`, `scripts/dev-*.sh` | **수정** (bootJar 경로) | `scripts/` |

총 93개 Java 파일 중 **수정 필요**: 약 25개, 나머지는 복사.
