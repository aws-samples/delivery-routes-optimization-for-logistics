plugins {
    `java-library`
}

val graphhopperVersion = providers.gradleProperty("graphhopperVersion").get()
val mapboxGeojsonVersion = providers.gradleProperty("mapboxGeojsonVersion").get()
val lombokVersion = providers.gradleProperty("lombokVersion").get()

dependencies {
    api(project(":core:core-impl"))

    // Jackson BOM - pinned here since core-impl does not depend on Jackson
    api(platform("com.fasterxml.jackson:jackson-bom:2.18.2"))

    // Routing engine
    api("com.graphhopper:graphhopper-core:$graphhopperVersion")

    // Geo utilities (used by PolylineHelper only)
    implementation("com.mapbox.mapboxsdk:mapbox-sdk-geojson:$mapboxGeojsonVersion")

    // Jackson for cache file serialization
    implementation("com.fasterxml.jackson.core:jackson-databind")
    implementation("com.fasterxml.jackson.core:jackson-annotations")

    // Logging
    implementation("org.slf4j:slf4j-api:2.0.16")

    // Lombok
    compileOnly("org.projectlombok:lombok:$lombokVersion")
    annotationProcessor("org.projectlombok:lombok:$lombokVersion")

    testImplementation("org.junit.jupiter:junit-jupiter:5.11.4")
    testImplementation("org.assertj:assertj-core:3.27.2")
}
