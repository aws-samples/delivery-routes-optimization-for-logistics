/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - @ApplicationScoped -> @Configuration.
 *   - @Inject field injection -> constructor injection.
 *   - GraphHopper is now exposed as a @Bean so that consumers (e.g. DispatchService)
 *     can also rely on Spring DI if they prefer; the original API `graphHopper()`
 *     and `routingProfile()` is preserved.
 */
package dev.aws.proto.core.routing.config;

import com.graphhopper.GraphHopper;
import dev.aws.proto.core.routing.route.GraphhopperLoader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(RoutingProperties.class)
public class RoutingConfig {
    private static final Logger logger = LoggerFactory.getLogger(RoutingConfig.class);

    private final RoutingProperties routingProperties;
    private final GraphhopperLoader loader;

    public RoutingConfig(RoutingProperties routingProperties) {
        this.routingProperties = routingProperties;
        this.loader = new GraphhopperLoader(
                routingProperties.localOsmDir(),
                routingProperties.localGraphhopperDir(),
                routingProperties.osmFile()
        );
        logger.info("Initializing GraphHopper loader with profile '{}'", routingProperties.routingProfile());
        this.loader.initAndLoad();
    }

    /**
     * GraphHopper instance, exposed as a Spring bean.
     */
    @Bean
    public GraphHopper graphHopper() {
        return this.loader.getHopper();
    }

    public String routingProfile() {
        return this.routingProperties.routingProfile();
    }
}
