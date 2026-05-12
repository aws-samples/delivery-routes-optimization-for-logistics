/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * GraphHopper readiness indicator exposed via Spring Boot Actuator.
 * Spring Boot Actuator auto-wires this bean as a readiness indicator when Actuator
 * is on the classpath (management.endpoint.health.probes.enabled=true).
 */
package dev.aws.proto.apps.appcore.api.health;

import com.graphhopper.GraphHopper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component("graphhopper")
public class GraphHopperHealthIndicator implements HealthIndicator {
    private static final Logger logger = LoggerFactory.getLogger(GraphHopperHealthIndicator.class);

    private final GraphHopper graphHopper;
    private final Environment environment;

    public GraphHopperHealthIndicator(GraphHopper graphHopper, Environment environment) {
        this.graphHopper = graphHopper;
        this.environment = environment;
    }

    @Override
    public Health health() {
        try {
            if (graphHopper != null && graphHopper.getFullyLoaded()) {
                return Health.up()
                        .withDetail("profile", String.join(",", environment.getActiveProfiles()))
                        .withDetail("graphhopper", "loaded")
                        .build();
            }
            return Health.down()
                    .withDetail("graphhopper", "not loaded")
                    .build();
        } catch (Exception e) {
            logger.error("GraphHopper health check error", e);
            return Health.down(e).build();
        }
    }
}
