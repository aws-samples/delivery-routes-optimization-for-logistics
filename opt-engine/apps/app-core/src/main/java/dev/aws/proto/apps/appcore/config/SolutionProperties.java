/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.appcore.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithName;

/**
 * Config properties for the solver config xml.
 */
@ConfigMapping(prefix = "quarkus.optaplanner")
public interface SolutionProperties {
    @WithName("solver-config-xml")
    String solverConfigXmlPath();
}
