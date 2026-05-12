plugins {
    `java-library`
    id("io.spring.dependency-management") version "1.1.7"
}

val springBootVersion = providers.gradleProperty("springBootVersion").get()
val optaplannerVersion = providers.gradleProperty("optaplannerVersion").get()
val awsSdk2DynamoJsonHelperVersion = providers.gradleProperty("awsSdk2DynamoJsonHelperVersion").get()
val lombokVersion = providers.gradleProperty("lombokVersion").get()

dependencyManagement {
    imports {
        mavenBom("org.springframework.boot:spring-boot-dependencies:$springBootVersion")
        mavenBom("org.optaplanner:optaplanner-bom:$optaplannerVersion")
    }
}

dependencies {
    api(project(":core:routing"))

    // Spring Boot (API-level so that nextday-delivery inherits web/actuator transitively)
    api("org.springframework.boot:spring-boot-starter-web")
    api("org.springframework.boot:spring-boot-starter-validation")
    api("org.springframework.boot:spring-boot-starter-actuator")

    // OptaPlanner core (Spring Boot starter is applied in the nextday-delivery app)
    api("org.optaplanner:optaplanner-core")

    // DDB Jackson helper (retained for backward compatibility)
    api("com.github.bijukunjummen:aws-sdk2-dynamo-json-helper:$awsSdk2DynamoJsonHelperVersion")

    // Lombok
    compileOnly("org.projectlombok:lombok:$lombokVersion")
    annotationProcessor("org.projectlombok:lombok:$lombokVersion")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
}
