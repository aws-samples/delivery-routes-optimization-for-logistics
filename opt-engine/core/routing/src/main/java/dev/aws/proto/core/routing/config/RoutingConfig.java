/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.routing.config;

import com.graphhopper.GraphHopper;
import dev.aws.proto.core.routing.route.GraphhopperLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

@ApplicationScoped
public class RoutingConfig {
    private static final Logger logger = LoggerFactory.getLogger(RoutingConfig.class);
    @Inject
    RoutingProperties routingProperties;

    private GraphhopperLoader loader;

    RoutingConfig(RoutingProperties routingProperties) {
        this.loader = new GraphhopperLoader(
                routingProperties.localOsmDir(),
                routingProperties.localGraphhopperDir(),
                routingProperties.osmFile()
        );

        this.routingProperties = routingProperties;

        this.loader.initAndLoad();
    }


    /**
     * Creates GraphHopper instance.
     *
     * @return GraphHopper
     */
    public GraphHopper graphHopper() {
        return this.loader.getHopper();
    }

    public String routingProfile() {
        return this.routingProperties.routingProfile();
    }
}
