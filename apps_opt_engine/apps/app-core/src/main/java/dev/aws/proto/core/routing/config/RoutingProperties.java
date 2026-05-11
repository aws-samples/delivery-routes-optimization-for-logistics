/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot notes:
 *   - Defined as a Java record bound via @ConfigurationProperties.
 *   - Property keys are kebab-case under `app.routing`.
 *   - Relaxed binding maps `local-osm-dir` -> `localOsmDir` automatically.
 */
package dev.aws.proto.core.routing.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.routing")
public record RoutingProperties(
        String localOsmDir,
        String localGraphhopperDir,
        String osmFile,
        String routingProfile
) {
}
