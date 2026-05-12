rootProject.name = "opt-engine"

pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

include(
    "core:core-impl",
    "core:routing",
    "apps:app-core",
    "apps:nextday-delivery",
    "apps:distancecache-util",
)
