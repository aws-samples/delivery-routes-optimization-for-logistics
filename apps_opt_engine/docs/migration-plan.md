# opt-engine 마이그레이션 계획

> 원본: `../delivery-routes-optimization-for-logistics/opt-engine` (Maven 멀티모듈, Quarkus 2.14, Java 17)
> 대상: `apps_opt_engine` (Gradle 멀티모듈 / Kotlin DSL, Spring Boot 3.5, Java 21)
> 참고 Gradle 예시: `/Users/pmkang/Codes/prototyping/engagements-2025/cj-logistics/qps-opt/packages/opt-qps-replenishment`

## 1. 개요 및 목표

기존 opt-engine 프로젝트는 AWS 프로토타입으로 배포된 **시간창 기반 차량 경로 최적화 엔진(Time-windowed VRP with additional warehouses)** 입니다. Quarkus + OptaPlanner + GraphHopper 조합이며, AWS SDK v2로 DynamoDB/S3/SSM/SecretsManager를 사용합니다. 현 시점의 최신 기술 스택으로 이식하되, **기능·API·알고리즘 거동은 그대로 보존**하는 것이 목표입니다.

### 주요 목표
- 기존 93개 Java 파일 전부 마이그레이션 (기능·패키지 구조 보존)
- Java 17 → **Java 21 LTS**
- Maven 멀티모듈 → **Gradle 멀티모듈 (Kotlin DSL)**
- Quarkus 2.14 → **Spring Boot 3.5.14**
- OptaPlanner 8.30 → **OptaPlanner 10.2.0** (Apache KIE)
- javax.* → jakarta.*
- 의존 라이브러리 최신 stable로 업그레이드
- 빌드 성공 및 기존 REST API 엔드포인트 호환 (`POST /opt-engine/solve`, `GET /opt-engine/status/{id}`)

### 비목표
- 알고리즘·Constraint 로직 변경 (보존)
- AWS 리소스·DynamoDB 스키마 변경 (보존)
- 프론트엔드·IaC 코드 변경 (본 리포 대상 아님)

---

## 2. 기존 프로젝트 분석

### 2.1 모듈 구조 (Maven)

```
opt-engine/
├── pom.xml                         # parent, Quarkus BOM, profiles
├── core/
│   ├── pom.xml                     # Quarkus REST 공통
│   ├── core-impl/                  # AWS SDK 유틸 (Ddb/S3/Ssm/Secrets/Sts/Credentials)
│   └── routing/                    # GraphHopper, 거리 매트릭스, 캐시 (File/S3)
└── apps/
    ├── pom.xml
    ├── app-core/                   # DispatchService 추상 베이스, health, config
    ├── nextday-delivery/           # 메인 Quarkus 앱 (uber-jar)
    └── distancecache-util/         # picocli CLI (jar-with-dependencies)
```

### 2.2 기술 스택

| 항목 | 기존 버전 |
|---|---|
| Java | 17 |
| Build | Maven 3.x (mvnw 포함) |
| Framework | Quarkus 2.14.0.Final |
| Solver | OptaPlanner 8.30.0.Final (+ optaplanner-quarkus) |
| Routing | GraphHopper 5.0, graphhopper-reader-osm 3.0-pre3 |
| AWS SDK | v2 BOM 2.17.209 (dynamodb, s3, secretsmanager, ssm, sts) |
| Geo | mapbox-sdk-geojson 5.8.0 (PolylineHelper 1곳) |
| DDB JSON | aws-sdk2-dynamo-json-helper 0.13.0 |
| CLI | picocli 4.6.3 |
| CSV | opencsv 5.3 |
| Lombok | 1.18.32 |
| Logging | jboss-logging, slf4j-jboss-logmanager, logback-classic(cli) |

### 2.3 Quarkus-specific 의존 코드 식별

`grep` 결과 48회 javax/quarkus import, 78회 Quarkus 어노테이션 사용. 주요 파일:

- `AppLifecycleMain` — `StartupEvent`/`ShutdownEvent` + `@Observes` + `@ApplicationScoped`
- `DispatchResource` (nextday) — `@Path("/opt-engine")`, `@POST/@GET`, `@PathParam`, `@Produces/@Consumes`, `@Inject`
- `DispatchService` (nextday/app-core) — `@ApplicationScoped`, `@Inject`
- `DdbServiceBase` 및 `Ddb*Service` 5개 — `@ApplicationScoped`, `@Inject`
- `DistanceCachingConfig`, `RoutingConfig`, `SolutionConfig` — `@ApplicationScoped`, `@Inject`
- `DispatchOrderConfig` — `@ConfigProperty`
- `RoutingProperties`, `SolutionProperties`, `DistanceCachingProperties`, `DdbProperties` — `@ConfigProperty` 기반 인터페이스
- `ReadinessCheckResource`, `LivenessResource` — JAX-RS health endpoints
- `ProfileManager` (Quarkus runtime configuration)
- `beans.xml` 파일 4개 (CDI bean discovery)

### 2.4 Quarkus-free 모듈

- `core/core-impl/src/.../util/aws/*` — AWS SDK 코드 (DI 없음, 거의 그대로 이전 가능)
- `core/routing/src/.../distance`, `location`, `route` — POJO/알고리즘 (거의 그대로 이전 가능)
  - 예외: `RoutingConfig`, `RoutingProperties`는 CDI/ConfigProperty
- `apps/distancecache-util` — picocli CLI, Quarkus 의존 없음, opencsv + logback 단독. 그대로 이전 가능

### 2.5 OptaPlanner 사용 패턴

- `@PlanningSolution`, `@PlanningEntity`, `@PlanningVariable`, `@PlanningId`, `@PlanningScore`, `@ValueRangeProvider`, `@ProblemFactCollectionProperty`, `@PlanningEntityCollectionProperty`, `@InverseRelationShadowVariable`, `@DeepPlanningClone`
- `VariableListener` 인터페이스 구현 2개 (`VisitIndexUpdatingVariableListener`, `VisitShadowVarsUpdatingVariableListener`)
- `HardMediumSoftLongScore` 사용
- `ConstraintProvider` + Constraint Streams API
- `SolverManager`, `SolverConfig.createFromXmlFile(...)` + 외부 `solver-config.xml`
- `ScoreDirector`, `SolverJob` 콜백 (`finalBestSolutionConsumer`)

> OptaPlanner 10.x는 8.x API와 높은 호환성을 가지며 `org.optaplanner.*` 패키지를 유지합니다(Timefold와 달리). 9.x에서 Jakarta EE 전환(javax → jakarta)이 이미 완료되어 10.x는 그 상태를 유지합니다.

---

## 3. 목표 기술 스택 (2026-05 기준)

| 항목 | 신 버전 | 근거 |
|---|---|---|
| Java | **21 LTS** (Amazon Corretto / Temurin) | Spring Boot 3.5 권장, LTS |
| Gradle | **8.10+** (Kotlin DSL) | Java 21 full support, 참고 프로젝트는 8.7/8.14 |
| Spring Boot | **3.5.14** | 2026-04 최신 3.5.x stable, 지원 기한 2026-06 |
| Spring Dependency Mgmt | 1.1.7 | 참고 프로젝트와 동일 |
| OptaPlanner | **10.2.0** | Apache KIE, Spring Boot 3.5.10 내장 지원 |
| GraphHopper | **11.0** | 최신, Java 21 호환 |
| AWS SDK v2 BOM | **2.42.19** | 2026-03 최신 stable |
| Lombok | **1.18.46** (Envious Ferret) | JDK 21–26 지원 |
| picocli | **4.7.6** | CLI 최신 stable |
| opencsv | **5.11** | Jakarta 호환 |
| Mapbox geojson | 5.8.0 (유지) | 서버에서 PolylineHelper 1곳만 사용 |
| aws-sdk2-dynamo-json-helper | 0.13.0 (유지) | 호환 유지 |
| Jackson | Spring Boot 관리 (2.18.x) | — |
| Logback | Spring Boot 관리 | — |

### 스택 결정 이유

- **OptaPlanner 10.2.0**: 사용자 요청에 따라 Timefold 제외. Apache Software Foundation에서 관리, Spring Boot 3.5.10 build-parent에 명시됨. `org.optaplanner.*` 네임스페이스 유지로 import 변경이 최소화되고, 9.x 이후 Jakarta EE로 이미 전환되어 Spring Boot 3.x와 호환.
- **Spring Boot 3.5.14**: OptaPlanner 10.2의 Spring Boot 버전(3.5.10)과 동일 마이너 브랜치. 참고 프로젝트와 동일 메이저.
- **GraphHopper 11**: `graphhopper-core` 최신. 구버전 5.0 API가 크게 바뀌었으므로 `GraphhopperLoader`, `GraphhopperRouter` 코드 검토 필요(주로 `GraphHopper` 빌더 API).
- **Timefold 미선택 이유**: 2.0은 Spring Boot 4 + Jackson 3 기반이고 VariableListener/HardMediumSoftLongScore가 제거됨. 1.x 선택 시에도 OptaPlanner 호환이지만, 사용자 요청에 따라 OptaPlanner 계열 유지.

---

## 4. 대상 프로젝트 구조

```
apps_opt_engine/
├── settings.gradle.kts                 # 루트, 모듈 include
├── build.gradle.kts                    # 루트 공통 설정 (subprojects 블록)
├── gradle.properties                   # 공통 버전, JVM 옵션
├── gradle/
│   └── libs.versions.toml              # Version Catalog (선택)
│   └── wrapper/…                       # Gradle Wrapper
├── gradlew / gradlew.bat
├── .gitignore
├── README.md
├── docs/
│   ├── migration-plan.md               # 본 문서
│   └── task-list.md                    # 작업 목록
├── scripts/                            # 기존 Dockerfile, 빌드 스크립트 포팅
│   ├── Dockerfile.nextdaydelivery
│   └── Dockerfile.distancecache
├── buildSrc/ (선택, 공통 플러그인 정의)
├── core/
│   ├── core-impl/
│   │   ├── build.gradle.kts
│   │   └── src/main/java/dev/aws/proto/core/…
│   └── routing/
│       ├── build.gradle.kts
│       └── src/main/java/dev/aws/proto/core/routing/…
└── apps/
    ├── app-core/
    │   ├── build.gradle.kts
    │   └── src/main/java/dev/aws/proto/apps/appcore/…
    ├── nextday-delivery/
    │   ├── build.gradle.kts
    │   └── src/main/{java,resources}/…
    └── distancecache-util/
        ├── build.gradle.kts
        └── src/main/{java,resources}/…
```

### 4.1 모듈별 역할 (원본 유지)

| 모듈 | 역할 | 주요 플러그인 |
|---|---|---|
| `core:core-impl` | AWS SDK 래퍼 (Credentials, Ddb, S3, Ssm, SecretsManager) | `java-library` |
| `core:routing` | 위치·거리 매트릭스, GraphHopper 로더/라우터, 캐시 persistence | `java-library` |
| `apps:app-core` | Spring DI 기반 공통 Config/Service/Health, DispatchService 추상 베이스 | `java-library` + `org.springframework.boot` (apply false) + `io.spring.dependency-management` |
| `apps:nextday-delivery` | Spring Boot 메인 앱, REST, OptaPlanner 통합, bootJar | `org.springframework.boot` |
| `apps:distancecache-util` | picocli CLI (executable JAR, shadowJar) | `java` + `com.gradleup.shadow` |

---

## 5. 마이그레이션 전략

### 5.1 프레임워크 매핑

| Quarkus / Jakarta EE (원본) | Spring Boot 3 (대상) |
|---|---|
| `@ApplicationScoped` | `@Service`, `@Component`, `@Configuration` |
| `@Singleton` | 기본 Spring bean scope (singleton) |
| `@Inject` | 생성자 주입 (선호) 또는 `@Autowired` |
| `@Path("/x")` (JAX-RS) | `@RestController` + `@RequestMapping("/x")` |
| `@GET @Path("y")` | `@GetMapping("/y")` |
| `@POST @Path("y")` | `@PostMapping("/y")` |
| `@PathParam("id")` | `@PathVariable("id")` |
| `@QueryParam("q")` | `@RequestParam("q")` |
| `@Produces(APPLICATION_JSON)` | 기본 Jackson MVC |
| `@Consumes(APPLICATION_JSON)` | `@RequestBody` |
| `@Observes StartupEvent` | `@EventListener(ApplicationReadyEvent.class)` |
| `@Observes ShutdownEvent` | `@PreDestroy` 또는 `@EventListener(ContextClosedEvent.class)` |
| `@ConfigProperty(name=x)` | `@Value("${x}")` 또는 `@ConfigurationProperties` |
| Quarkus config interface (`@ConfigMapping`) | Java record + `@ConfigurationProperties(prefix="…")` |
| `%dev.xxx=yyy` 프로파일 값 | `application-dev.properties` + `spring.profiles.active=dev` |
| `quarkus.http.port` | `server.port` |
| `quarkus.http.cors.*` | Spring MVC CORS config (`WebMvcConfigurer`) 또는 `spring.web.cors.*` |
| `quarkus.log.*` | `logging.*` (Spring Boot Logback) |
| `quarkus.optaplanner.solver-config-xml` | `optaplanner.solver.solver-config-xml` |
| Quarkus uber-jar | Spring Boot `bootJar` |
| SmallRye Health (`/q/health/live`, `/q/health/ready`) | Spring Boot Actuator (`/actuator/health/liveness`, `/actuator/health/readiness`) |
| `beans.xml` (CDI) | 불필요, 제거 |

### 5.2 패키지/import 전역 치환

- `javax.enterprise.context.*` → 제거 (Spring 어노테이션으로 교체)
- `javax.inject.*` → 제거 (생성자 주입)
- `javax.ws.rs.*` → `org.springframework.web.bind.annotation.*`
- `io.quarkus.runtime.*` → Spring `ApplicationReadyEvent`, `@EventListener`
- `io.quarkus.runtime.configuration.ProfileManager` → `Environment.getActiveProfiles()` 또는 `@Profile`
- `org.eclipse.microprofile.config.inject.ConfigProperty` → `@Value` / `@ConfigurationProperties`
- OptaPlanner imports: `org.optaplanner.*` 그대로 유지 (8→10 API 호환)
- Lombok, SLF4J, Jackson 등은 그대로

### 5.3 주요 Spring Boot 통합 포인트

1. **메인 애플리케이션 클래스** (`OptEngineApplication`) 신규 작성 — `@SpringBootApplication` + `SpringApplication.run(...)`.
2. **OptaPlanner Spring Boot Starter** 자동 구성 사용. `optaplanner-spring-boot-starter` 의존성 추가 시 `SolverManager` 빈이 자동 등록. 기존 코드는 직접 `SolverManager.create(...)`로 생성하므로 두 방식 중 선택:
   - (A) 자동 구성 그대로 사용: `application.properties`의 `optaplanner.solver.solver-config-xml=solver-config.xml` 설정, 코드에서 `SolverManager` 주입.
   - (B) 기존 방식 유지: `solver-config.xml` 경로를 직접 로드하여 `SolverManager`를 `@Bean`으로 등록. 기존 "solver-config.xml을 jar 옆에 두고 실행 시 로드" 패턴 유지에 유리 (참고 프로젝트도 이 방식).
   - **채택: (B)** — 원본 `SolutionConfig.getSolverConfigXmlPath()`의 파일 탐색 로직을 그대로 이식하여 dev/prod 모두 호환.
3. **Actuator** 추가로 health endpoint 대체: `/actuator/health`, `/actuator/health/liveness`, `/actuator/health/readiness`. 기존 `LivenessResource`, `ReadinessCheckResource`는 삭제하되, 원하면 레거시 경로(`/q/health/live` 등)를 호환하는 컨트롤러 유지.
4. **CORS**: 기존 `quarkus.http.cors.*` 설정을 Spring MVC `WebMvcConfigurer#addCorsMappings` 또는 `spring.web.cors.*` 속성으로 재현.
5. **Gzip**: Spring Boot 기본 지원 `server.compression.enabled=true`.

### 5.4 OptaPlanner 8.30 → 10.2 체크리스트

OptaPlanner 8.x → 10.x 업그레이드는 비교적 부드럽지만 다음을 검토:

- [ ] `SolverConfig.createFromXmlFile(Path)` 시그니처 그대로 유지 (확인됨)
- [ ] `SolverManager.create(SolverConfig, SolverManagerConfig)` 유지
- [ ] `ConstraintProvider` Constraint Streams API 유지 (Bavet이 기본)
- [ ] `HardMediumSoftLongScore` 유지 (10.x에서 deprecated 아님)
- [ ] `VariableListener` 유지 (10.x에서 deprecated 아님)
- [ ] `@DeepPlanningClone` 유지
- [ ] `@InverseRelationShadowVariable` 유지
- [ ] `solver-config.xml` 스키마 호환 (필요 시 namespace 업데이트)
- [ ] Drools 기반 constraint 미사용 (본 프로젝트는 Constraint Streams만 사용 ✓)

### 5.5 GraphHopper 5 → 11 체크리스트

GraphHopper는 5 → 11 사이 API가 상당히 변경되었습니다. 마이그레이션 시 확인 포인트:

- [ ] `GraphHopper` 빌더·초기화 API (`setOSMFile`, `setGraphHopperLocation`, `setProfiles`, `importOrLoad()`) 변경 사항
- [ ] `EncodingManager` 생성 방식 변경 (이제 `Profile` 기반)
- [ ] `GHRequest`/`GHResponse` 메서드명 변경 (`setVehicle` 제거, `setProfile` 사용)
- [ ] `graphhopper-reader-osm` 별도 패키지 → 11.x에서 `graphhopper-core`에 통합 (reader-osm 의존성 제거 가능성)
- [ ] `CustomModel` 도입, `Weighting` 직접 사용 제한
- [ ] `Router`, `PathWrapper`(Deprecated) → `ResponsePath`

원본 `GraphhopperLoader`와 `GraphhopperRouter` 코드 검토 후 API 호출부만 조정하고 알고리즘 로직은 보존.

### 5.6 Mapbox geojson 처리

- 사용처: `core/routing/.../route/PolylineHelper.java`에서 `com.mapbox.geojson.Point`, `com.mapbox.geojson.utils.PolylineUtils` 사용 (인코딩된 polyline → `List<Point>`).
- 방안: 기존 5.8.0 그대로 유지(호환 문제 없음) 또는 7.10.0으로 업그레이드 가능.
- 대체도 가능: `com.davidmoten:openlr-encoder` 계열, 또는 자체 Polyline decoder 구현. 범위 최소화를 위해 **기존 버전 유지** 방침.

### 5.7 CLI (`distancecache-util`) 처리

- picocli 기반 standalone, Quarkus 의존성 매우 적음 (`jboss-logging`만 상속 가능성)
- Spring Boot가 아닌 standalone Java CLI로 유지
- Gradle `application` + `com.gradleup.shadow` 플러그인으로 executable fat-jar 빌드
- 기존 `distance-cache-util-jar-with-dependencies.jar` 산출물 이름 유지

---

## 6. 빌드 체계 (Gradle 멀티모듈, Kotlin DSL)

### 6.1 `settings.gradle.kts` 구조

```kotlin
rootProject.name = "opt-engine"

include(
    "core:core-impl",
    "core:routing",
    "apps:app-core",
    "apps:nextday-delivery",
    "apps:distancecache-util"
)
```

### 6.2 루트 `build.gradle.kts` (공통)

- `subprojects { }` 블록에서 Java 21 toolchain, `mavenCentral()`, Lombok, SLF4J 공통 설정
- `plugins { id("org.springframework.boot") apply false; id("io.spring.dependency-management") apply false; id("java-library") apply false }` 선언
- 모든 subproject에 `io.spring.dependency-management` 적용하여 Spring Boot BOM, AWS SDK BOM, OptaPlanner BOM 임포트
- `java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }`
- Lombok annotation processor 공통 설정

### 6.3 모듈별 `build.gradle.kts` 요약

- **`core:core-impl`**: `java-library`, 의존: AWS SDK (dynamodb, s3, secretsmanager, ssm, sts), jackson-databind(필요 시)
- **`core:routing`**: `java-library`, 의존: `graphhopper-core`, mapbox-sdk-geojson, jackson, lombok. `core:core-impl` 참조.
- **`apps:app-core`**: `java-library`, 의존: `core:routing`, Spring Web(starter-web), OptaPlanner core, `aws-sdk2-dynamo-json-helper`. Lombok.
- **`apps:nextday-delivery`**: `org.springframework.boot`, `io.spring.dependency-management`, 의존: `apps:app-core`, `optaplanner-spring-boot-starter`, `spring-boot-starter-web`, `spring-boot-starter-actuator`, `spring-boot-starter-validation`. `bootJar { archiveFileName = "delivery-dispatch.jar" }`. solver-config.xml 복사 태스크.
- **`apps:distancecache-util`**: `application`, `com.gradleup.shadow`, 의존: `core:routing`, picocli, opencsv, logback-classic. Main class = `dev.aws.proto.apps.distancecache.util.App`. shadowJar archive base name `distance-cache-util`.

### 6.4 Docker / 배포

- 기존 `scripts/Dockerfile.nextdaydelivery`, `scripts/Dockerfile.distancecache`를 이전 + Spring Boot layered jar 최적화(선택).
- `build_opt_engine.sh` 대체 스크립트 (`./gradlew :apps:nextday-delivery:bootJar :apps:distancecache-util:shadowJar`).

---

## 7. 설정 파일 변환

### 7.1 `application.properties` (nextday-delivery)

| Quarkus | Spring Boot |
|---|---|
| `quarkus.http.port=8080` | `server.port=8080` |
| `quarkus.http.cors=true` | `spring.web.cors.enabled=true` + CorsConfig |
| `quarkus.http.cors.exposed-headers=Content-Disposition` | `spring.web.cors.exposed-headers=Content-Disposition` |
| `quarkus.http.cors.access-control-max-age=24H` | `spring.web.cors.max-age=24h` |
| `quarkus.http.cors.access-control-allow-credentials=true` | `spring.web.cors.allow-credentials=true` |
| `quarkus.resteasy.gzip.enabled=true` | `server.compression.enabled=true` |
| `quarkus.resteasy.gzip.max-input=10M` | `server.compression.min-response-size=1KB` (형태 다름) |
| `quarkus.package.type=uber-jar` | (bootJar 기본) |
| `quarkus.log.category."org.optaplanner".level=INFO` | `logging.level.org.optaplanner=INFO` |
| `quarkus.log.console.format=%d{HH:mm:ss.SSS}...` | `logback-spring.xml` 또는 `logging.pattern.console=...` |
| `quarkus.log.file.enable=false` + `quarkus.log.file.path=logs/dispatcher.log` | `logging.file.name=logs/dispatcher.log` |
| `quarkus.vertx.max-worker-execute-time=360` | Spring 구성 불필요 (비동기 방식 다름, 기본값 사용) |
| `quarkus.optaplanner.solver-config-xml=solver-config.xml` | `optaplanner.solver.solver-config-xml=solver-config.xml` 또는 `SolutionConfig` 유지 |
| `%dev.xxx=yyy` | `application-dev.properties` |
| `%test.xxx=yyy` | `application-test.properties` |

- `app.xxx.yyy` 접두어 커스텀 속성은 그대로 유지 (`@ConfigurationProperties(prefix="app.xxx")`)
- `aws.region`, `aws.profile`은 Spring Cloud AWS나 AWS SDK 기본 체인이 읽음 (기존 `CredentialsHelper`가 시스템 프로퍼티로 사용)

### 7.2 `solver-config.xml`

원본 구조 그대로 유지. 필요 시 namespace 업데이트:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<solver xmlns="https://www.optaplanner.org/xsd/solver"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="https://www.optaplanner.org/xsd/solver https://www.optaplanner.org/xsd/solver/solver.xsd">
  ...
</solver>
```

### 7.3 `logback-spring.xml` (distancecache-util & nextday-delivery)

기존 logback.xml 포맷 이식. Spring Boot는 `logback-spring.xml`을 우선 읽음.

---

## 8. 리스크 및 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| GraphHopper 5 → 11 API 대규모 변경 | 중~상 | 초기 스파이크로 `GraphhopperLoader`/`GraphhopperRouter` 빌드 성공까지 우선 확인. 실패 시 GraphHopper 9 (상대적으로 덜 변경) 후보 고려. |
| OptaPlanner 10.x가 아직 Apache Incubator 상태 | 중 | Maven Central 배포됨, Apache 프로젝트 안정성 있음. 필요 시 9.44.0.Final fallback 계획 보유. |
| Quarkus profile(%dev/%test) → Spring profile 변환 중 누락 | 중 | `application-dev.properties`, `application-test.properties` 철저히 매핑. Gradle `bootRun { args("--spring.profiles.active=dev") }` 제공. |
| `beans.xml`, `@Observes StartupEvent` 누락 | 저 | 체크리스트로 확인. Startup 로직은 `@EventListener(ApplicationReadyEvent)`로 일원화. |
| `ConfigMapping` 스타일 → `@ConfigurationProperties(prefix)` 변환 | 중 | 각 Properties 인터페이스를 Java record 또는 class로 변환하고 `@ConfigurationProperties` 적용. |
| GraphHopper reader-osm 3.0-pre3 아티팩트가 11에서 별도 제공되지 않을 수 있음 | 중 | `graphhopper-core` 11.x에 OSM 리더 내장 여부 확인. 내장되어 있으면 reader-osm 의존성 제거. |
| OptaPlanner Spring Boot Starter 자동 구성과 수동 SolverManager 생성 충돌 | 저 | 기존 코드 방식(수동 생성) 유지. 필요 시 `optaplanner.spring.boot.auto.enabled=false` 또는 starter 대신 core만 사용. |
| CDI 생명주기 (Construct-time init vs lazy) 차이 | 저~중 | 생성자 주입으로 일원화. Eager init 필요 시 `@PostConstruct` 사용. |
| 테스트 파일이 원본에 없음 (기존 프로젝트는 유닛 테스트 부재) | 저 | 최소 smoke test (`ApplicationContext` 로드) 추가. |

---

## 9. 마이그레이션 순서 (단계별)

아래 순서는 `docs/task-list.md`의 세부 태스크와 1:1 대응합니다.

1. **S0 - 스켈레톤**: Gradle wrapper, `settings.gradle.kts`, 루트 `build.gradle.kts`, 5개 서브모듈 `build.gradle.kts`, `.gitignore`, README.
2. **S1 - core:core-impl**: 패키지 복사 + `@Inject` 제거(사용되지 않음) → 컴파일 성공 확인.
3. **S2 - core:routing**: 패키지 복사 + `RoutingConfig` Spring 전환(`@Configuration` + `@ConfigurationProperties`). GraphHopper 11 API 적응.
4. **S3 - apps:app-core**: 공통 추상 `DispatchService`, Config 전환, health resource 제거(Actuator 사용).
5. **S4 - apps:nextday-delivery**: Spring Boot 메인 앱, Config, REST Controller, Service, Lifecycle 전환, solver-config.xml 복사. `bootJar` 성공.
6. **S5 - apps:distancecache-util**: CLI 이식, shadowJar 성공.
7. **S6 - 검증**: `./gradlew build` 통과, `bootRun` 기동 확인 (GraphHopper/AWS 없이 최소 기동).
8. **S7 - 문서 마무리**: README 업데이트, 실행/배포 가이드.

---

## 10. 실행 / 배포 가이드 (최종)

빌드:
```bash
./gradlew clean build
./gradlew :apps:nextday-delivery:bootJar
./gradlew :apps:distancecache-util:shadowJar
```

실행 (dev):
```bash
./gradlew :apps:nextday-delivery:bootRun --args='--spring.profiles.active=dev'
# 또는
java -jar apps/nextday-delivery/build/libs/delivery-dispatch.jar --spring.profiles.active=dev
```

CLI 실행:
```bash
java -jar apps/distancecache-util/build/libs/distance-cache-util.jar build-lat-long --help
```

---

## 11. 참고 자료

- 원본: `../delivery-routes-optimization-for-logistics/opt-engine`
- 참고 Gradle: `/Users/pmkang/Codes/prototyping/engagements-2025/cj-logistics/qps-opt/packages/opt-qps-replenishment`
- Spring Boot 3.5.x: https://docs.spring.io/spring-boot/3.5/
- OptaPlanner 10.2 (Apache KIE): https://kie.apache.org/docs/components/optaplanner/
- OptaPlanner Spring Boot Quickstart: https://docs.optaplanner.org/latest/
- GraphHopper 11: https://github.com/graphhopper/graphhopper/releases
- AWS SDK for Java 2.x: https://docs.aws.amazon.com/sdk-for-java/latest/developer-guide/
