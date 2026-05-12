plugins {
    application
    id("com.gradleup.shadow") version "8.3.5"
    id("io.spring.dependency-management") version "1.1.7"
}

val awsSdkVersion = providers.gradleProperty("awsSdkVersion").get()
val picocliVersion = providers.gradleProperty("picocliVersion").get()
val opencsvVersion = providers.gradleProperty("opencsvVersion").get()
val lombokVersion = providers.gradleProperty("lombokVersion").get()

dependencyManagement {
    imports {
        mavenBom("software.amazon.awssdk:bom:$awsSdkVersion")
    }
}

dependencies {
    implementation(project(":core:routing"))

    implementation("info.picocli:picocli:$picocliVersion")
    annotationProcessor("info.picocli:picocli-codegen:$picocliVersion")

    implementation("com.opencsv:opencsv:$opencsvVersion")
    implementation("ch.qos.logback:logback-classic:1.5.17")
    implementation("org.slf4j:slf4j-api")

    // AWS SDK v2
    implementation("software.amazon.awssdk:dynamodb")
    implementation("software.amazon.awssdk:s3")

    // Lombok
    compileOnly("org.projectlombok:lombok:$lombokVersion")
    annotationProcessor("org.projectlombok:lombok:$lombokVersion")

    testImplementation("org.junit.jupiter:junit-jupiter:5.11.4")
}

application {
    mainClass.set("dev.aws.proto.apps.distancecache.util.App")
}

tasks.shadowJar {
    archiveBaseName.set("distance-cache-util")
    archiveClassifier.set("")
    archiveVersion.set("")
    mergeServiceFiles()
}

tasks.named("build") {
    dependsOn(tasks.shadowJar)
}
