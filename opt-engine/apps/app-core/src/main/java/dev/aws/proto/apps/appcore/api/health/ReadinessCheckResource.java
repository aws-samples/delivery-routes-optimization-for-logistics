/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.api.health;

import com.graphhopper.GraphHopper;
import dev.aws.proto.core.routing.config.RoutingConfig;
import io.quarkus.runtime.configuration.ProfileManager;
import org.eclipse.microprofile.health.HealthCheck;
import org.eclipse.microprofile.health.HealthCheckResponse;
import org.eclipse.microprofile.health.HealthCheckResponseBuilder;
import org.eclipse.microprofile.health.Readiness;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

@Readiness
@ApplicationScoped
public class ReadinessCheckResource implements HealthCheck {
    Logger logger = LoggerFactory.getLogger(ReadinessCheckResource.class);

    @Inject
    RoutingConfig routingConfig;

    @Override
    public HealthCheckResponse call() {

        HealthCheckResponseBuilder responseBuilder = HealthCheckResponse.named("Readiness check");

        try {
            GraphHopper hopper = routingConfig.graphHopper();
            if (hopper != null && hopper.getFullyLoaded()) {
                responseBuilder.up()
                        .withData("profile", ProfileManager.getActiveProfile())
                        .withData("graphhopper", "loaded");
            }
        } catch (Exception e) {
            logger.error("Health check error", e);
            responseBuilder.down();
        }

        return responseBuilder.build();
    }
}