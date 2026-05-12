# opt-engine (Spring Boot + Gradle multi-module)

Time-windowed VRP delivery route optimization engine built on
**Java 21 + Spring Boot 3.5 + OptaPlanner 10.2 + Gradle 8.x (Kotlin DSL)**.

## Module Layout

```
opt-engine/
├── core/
│   ├── core-impl/           # AWS SDK v2 utilities (DDB / S3 / SSM / SecretsManager)
│   └── routing/             # GraphHopper routing, distance matrix, cache persistence
└── apps/
    ├── app-core/            # Spring-level shared: config, DispatchService base, health
    ├── nextday-delivery/    # Spring Boot main application (REST + OptaPlanner)
    └── distancecache-util/  # picocli CLI (standalone shadow jar)
```

## Requirements

- **JDK 21** (Amazon Corretto 21 or Temurin 21 recommended)
- Gradle 8.10+ (use the bundled wrapper)
- AWS account (DynamoDB / SSM / S3 access required for production runs)
- (Optional) Docker

## Quick Start

### Full Build

```bash
./gradlew clean build
```

### Run the Main Application (Spring Boot)

```bash
# dev profile
./gradlew :apps:nextday-delivery:bootRun --args='--spring.profiles.active=dev'

# run the built jar (solver-config.xml must live next to it)
java -jar apps/nextday-delivery/build/libs/delivery-dispatch.jar --spring.profiles.active=dev \
     -Dwarehouse-code=95001200 -Dorder-date=20230101
```

Default REST endpoints:
- `POST /opt-engine/solve` — start a solver job
- `GET /opt-engine/status/{problemId}` — query the result
- `GET /actuator/health` — general health
- `GET /actuator/health/liveness`, `/readiness` — k8s-style probes (provided by Spring Actuator)

### Run the CLI (distancecache-util)

```bash
./gradlew :apps:distancecache-util:shadowJar
java -jar apps/distancecache-util/build/libs/distance-cache-util.jar --help
java -jar apps/distancecache-util/build/libs/distance-cache-util.jar build-lat-long \
     --warehouse 95001200 --bucketname /DevProto/S3/DistanceCache/BucketName
```

## Tech Stack

| Item | Version |
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

## Configuration

| Profile | File | Purpose |
|---|---|---|
| (default) | `application.properties` | Production defaults |
| `dev` | `application-dev.properties` | Local development |
| `test` | `application-test.properties` | Tests |

Key properties:
- `server.port` — HTTP port (8080 by default, 8888 for dev)
- `app.routing.*` — OSM / GraphHopper paths
- `app.routing.cache.*` — distance-matrix cache (file / s3)
- `app.ssmparams.ddb.*` — SSM parameter names used to resolve the real DynamoDB table names
- `app.dispatch.config.*` — dispatch settings (warehouse-code, order-date, max-contracted-vehicles, max-time-groups)
- `app.dispatch.auto-solve-on-startup` — whether to run the solver automatically at application startup (batch mode)

## Initializing the Gradle Wrapper

If the wrapper jar is missing, generate it with:

```bash
gradle wrapper --gradle-version 8.10 --distribution-type bin
```

Once generated, `./gradlew` can be used from anywhere in the module.
