plugins {
    java
    id("org.springframework.boot") version "3.5.14"
    id("io.spring.dependency-management") version "1.1.7"
}

val optaplannerVersion = providers.gradleProperty("optaplannerVersion").get()
val lombokVersion = providers.gradleProperty("lombokVersion").get()

dependencyManagement {
    imports {
        mavenBom("org.optaplanner:optaplanner-bom:$optaplannerVersion")
    }
}

dependencies {
    implementation(project(":apps:app-core"))

    implementation("org.optaplanner:optaplanner-spring-boot-starter")

    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-validation")

    // Lombok
    compileOnly("org.projectlombok:lombok:$lombokVersion")
    annotationProcessor("org.projectlombok:lombok:$lombokVersion")

    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation("io.rest-assured:rest-assured")
    testImplementation("org.optaplanner:optaplanner-test")
}

springBoot {
    mainClass = "dev.aws.proto.apps.nextday.OptEngineApplication"
}

tasks.bootJar {
    archiveFileName = "delivery-dispatch.jar"
    // Place solver-config.xml next to the fat jar so it is resolvable at runtime
    doLast {
        copy {
            from("src/main/resources/solver-config.xml")
            into(layout.buildDirectory.dir("libs"))
        }
        logger.lifecycle("solver-config.xml copied to build/libs")
    }
}

tasks.register<JavaExec>("runBoot") {
    group = "application"
    description = "Runs the Spring Boot application"
    classpath = sourceSets["main"].runtimeClasspath
    mainClass.set("dev.aws.proto.apps.nextday.OptEngineApplication")
}
