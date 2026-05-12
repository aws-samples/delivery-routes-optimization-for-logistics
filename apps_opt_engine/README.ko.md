# opt-engine (Spring Boot + Gradle 멀티모듈)

배달 경로 최적화 엔진(Time-windowed VRP). 기존 Quarkus 2.14 기반 Maven 멀티모듈 프로젝트를 **Java 21 + Spring Boot 3.5 + OptaPlanner 10.2 + Gradle 8.x(Kotlin DSL)** 로 마이그레이션한 버전입니다.

> 원본: `../delivery-routes-optimization-for-logistics/opt-engine`
> 마이그레이션 계획: [`docs/migration-plan.md`](docs/migration-plan.md) / 작업 목록: [`docs/task-list.md`](docs/task-list.md)

## 모듈 구조

```
opt-engine/
├── core/
│   ├── core-impl/           # AWS SDK v2 유틸 (DDB / S3 / SSM / SecretsManager)
│   └── routing/             # GraphHopper 라우팅, 거리 매트릭스, 캐시 persistence
└── apps/
    ├── app-core/            # Spring 공통: Config, DispatchService 추상 베이스, Health
    ├── nextday-delivery/    # Spring Boot 메인 애플리케이션 (REST + OptaPlanner)
    └── distancecache-util/  # picocli CLI (standalone shadowJar)
```

## 요구 사항

- **JDK 21** (Amazon Corretto 21 또는 Temurin 21 권장)
- Gradle 8.10+ (wrapper 사용)
- AWS 계정 (프로덕션 실행 시 DynamoDB/SSM/S3 접근 필요)
- (선택) Docker

## 빠른 시작

### 전체 빌드

```bash
./gradlew clean build
```

### 메인 애플리케이션 실행 (Spring Boot)

```bash
# dev 프로파일
./gradlew :apps:nextday-delivery:bootRun --args='--spring.profiles.active=dev'

# 빌드된 jar 실행 (solver-config.xml 옆에 있어야 함)
java -jar apps/nextday-delivery/build/libs/delivery-dispatch.jar --spring.profiles.active=dev \
     -Dwarehouse-code=95001200 -Dorder-date=20230101
```

기본 REST 엔드포인트:
- `POST /opt-engine/solve` — 솔버 작업 시작
- `GET /opt-engine/status/{problemId}` — 결과 조회
- `GET /actuator/health` — health
- `GET /actuator/health/liveness`, `/readiness` — k8s-style probes (Actuator 자동 제공)

### CLI 실행 (distancecache-util)

```bash
./gradlew :apps:distancecache-util:shadowJar
java -jar apps/distancecache-util/build/libs/distance-cache-util.jar --help
java -jar apps/distancecache-util/build/libs/distance-cache-util.jar build-lat-long \
     --warehouse 95001200 --bucketname /DevProto/S3/DistanceCache/BucketName
```

## 주요 스택

| 항목 | 버전 |
|---|---|
| Java | 21 LTS |
| Gradle | 8.10+ (Kotlin DSL) |
| Spring Boot | 3.5.14 |
| OptaPlanner | 10.2.0 (Apache KIE) |
| GraphHopper | 11.0 |
| AWS SDK v2 | 2.42.19 (BOM) |
| Lombok | 1.18.46 |
| picocli | 4.7.6 |
| opencsv | 5.11 |

## 설정

| 프로파일 | 파일 | 용도 |
|---|---|---|
| (default) | `application.properties` | 프로덕션 기본값 |
| `dev` | `application-dev.properties` | 로컬 개발 |
| `test` | `application-test.properties` | 테스트 |

주요 속성:
- `server.port` — HTTP 포트 (기본 8080, dev는 8888)
- `app.routing.*` — OSM / GraphHopper 경로
- `app.routing.cache.*` — 거리 매트릭스 캐시 (file/s3)
- `app.ssmparams.ddb.*` — SSM 파라미터 이름 (실제 DDB 테이블 이름 조회)
- `app.dispatch.config.*` — 배차 설정 (warehouse-code, order-date, max-contracted-vehicles, max-time-groups)
- `app.dispatch.auto-solve-on-startup` — 애플리케이션 시작 시 자동 솔버 실행 여부 (batch 모드)

## Gradle Wrapper 초기화

현재 저장소는 wrapper jar 없이 커밋되어 있습니다. 아래 명령으로 생성해 주세요.

```bash
gradle wrapper --gradle-version 8.10 --distribution-type bin
```

그러면 `./gradlew` 를 통해 어디서든 빌드가 가능합니다.

## 마이그레이션 노트

- 기존 Quarkus 어노테이션(`@ApplicationScoped`, `@Inject`, `@Path/@GET/@POST`, `StartupEvent/ShutdownEvent`) 는 Spring Boot 어노테이션(`@Service/@Component/@Configuration`, 생성자 주입, `@RestController/@GetMapping/@PostMapping`, `@EventListener(ApplicationReadyEvent.class)`)으로 치환.
- `javax.*` → `jakarta.*` (Spring Boot 3.x / OptaPlanner 9+ 요구).
- OptaPlanner 8.30 → 10.2.0: `org.optaplanner.*` 네임스페이스 유지. 솔버 설정 XML, Constraint Streams, VariableListener, HardMediumSoftLongScore 모두 그대로 사용.
- GraphHopper 5 → 11: `CarFlagEncoder`/`FlagEncoderFactory` 제거됨. Profile은 이름("car", "motorcycle")만으로 등록.
- Quarkus profile(%dev) → Spring profile (`application-dev.properties`).
- SmallRye Health → Spring Actuator + `GraphHopperHealthIndicator` 커스텀 HealthIndicator.
- 자세한 내용은 `docs/migration-plan.md` 참조.
