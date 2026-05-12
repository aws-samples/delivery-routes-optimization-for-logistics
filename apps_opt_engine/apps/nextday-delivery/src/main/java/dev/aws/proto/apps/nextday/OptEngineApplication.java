/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.nextday;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Next-day delivery dispatch route optimization Spring Boot application entrypoint.
 *
 * `@ConfigurationPropertiesScan` ensures that @ConfigurationProperties records that
 * are NOT explicitly enabled by `@EnableConfigurationProperties` (e.g. DdbProperties)
 * are still picked up as beans.
 */
@SpringBootApplication(scanBasePackages = {
        "dev.aws.proto.apps.nextday",
        "dev.aws.proto.apps.appcore",
        "dev.aws.proto.core.routing.config"
})
@ConfigurationPropertiesScan(basePackages = {
        "dev.aws.proto.apps.nextday.config",
        "dev.aws.proto.apps.appcore.config",
        "dev.aws.proto.core.routing.config"
})
public class OptEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(OptEngineApplication.class, args);
    }
}
