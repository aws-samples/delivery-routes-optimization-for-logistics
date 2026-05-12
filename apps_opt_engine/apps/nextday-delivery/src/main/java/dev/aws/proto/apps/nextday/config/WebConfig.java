/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring MVC CORS configuration. Properties are keyed under `app.web.cors.*`.
 */
package dev.aws.proto.apps.nextday.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.web.cors.allowed-origins:*}")
    private String allowedOrigins;

    @Value("${app.web.cors.allowed-methods:GET,POST,PUT,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${app.web.cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Value("${app.web.cors.max-age:86400}")
    private long maxAge;

    @Value("${app.web.cors.exposed-headers:Content-Disposition}")
    private String exposedHeaders;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // When credentials are allowed, wildcard origins must be replaced with
        // `allowedOriginPatterns` per the Servlet CORS spec.
        boolean wildcard = "*".equals(allowedOrigins.trim());

        var mapping = registry.addMapping("/**")
                .allowedMethods(allowedMethods.split(","))
                .exposedHeaders(exposedHeaders.split(","))
                .maxAge(maxAge)
                .allowCredentials(allowCredentials);

        if (wildcard) {
            mapping.allowedOriginPatterns("*");
        } else {
            mapping.allowedOrigins(allowedOrigins.split(","));
        }
    }
}
