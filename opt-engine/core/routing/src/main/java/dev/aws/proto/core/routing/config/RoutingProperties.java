/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.routing.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithName;

@ConfigMapping(prefix = "app.routing")
public interface RoutingProperties {

    @WithName("local-osm-dir")
    String localOsmDir();

    @WithName("local-graphhopper-dir")
    String localGraphhopperDir();

    @WithName("osm-file")
    String osmFile();

    @WithName("routing-profile")
    String routingProfile();
}
