/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - Converted to @ConfigurationProperties record.
 *   - Property prefix is `optaplanner.solver`, matching the optaplanner Spring Boot
 *     starter so that auto-configuration and custom lookup logic read the same key.
 */
package dev.aws.proto.apps.appcore.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Config properties for the solver config xml.
 */
@ConfigurationProperties(prefix = "app.solver")
public record SolutionProperties(String solverConfigXml) {

    /** Backwards-compatible accessor that mirrors the original interface method. */
    public String solverConfigXmlPath() {
        return solverConfigXml;
    }
}
