plugins {
    `java-library`
}

val awsSdkVersion = providers.gradleProperty("awsSdkVersion").get()
val lombokVersion = providers.gradleProperty("lombokVersion").get()

dependencies {
    // AWS SDK v2 BOM - expose as api platform so that consumers inherit managed versions
    api(platform("software.amazon.awssdk:bom:$awsSdkVersion"))

    // AWS SDK v2
    api("software.amazon.awssdk:dynamodb")
    api("software.amazon.awssdk:s3")
    api("software.amazon.awssdk:secretsmanager")
    api("software.amazon.awssdk:ssm")
    api("software.amazon.awssdk:sts")
    api("software.amazon.awssdk:auth")
    api("software.amazon.awssdk:regions")

    // Logging
    implementation("org.slf4j:slf4j-api:2.0.16")

    // Lombok
    compileOnly("org.projectlombok:lombok:$lombokVersion")
    annotationProcessor("org.projectlombok:lombok:$lombokVersion")

    testImplementation("org.junit.jupiter:junit-jupiter:5.11.4")
    testImplementation("org.assertj:assertj-core:3.27.2")
}
