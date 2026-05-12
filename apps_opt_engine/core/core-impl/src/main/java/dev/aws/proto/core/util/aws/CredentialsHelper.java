/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Framework-free AWS credentials helper.
 * - Active profile is discovered from the `spring.profiles.active` system property
 *   or the SPRING_PROFILES_ACTIVE environment variable, falling back to "prod".
 * - `aws.profile` and `aws.region` are read from system properties or environment
 *   variables (AWS_PROFILE, AWS_REGION) so that this module remains framework-free.
 */
package dev.aws.proto.core.util.aws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;

public final class CredentialsHelper {
    private static final Logger logger = LoggerFactory.getLogger(CredentialsHelper.class);

    private static Region region;
    private static AwsCredentialsProvider credentialsProvider;

    private CredentialsHelper() {
        // utility class
    }

    public static AwsCredentialsProvider getCredentialsProvider() {
        if (credentialsProvider == null) {
            AwsCredentialsProvider currentCredentialsProvider;
            String activeProfile = getActiveProfile();

            logger.trace("getCredentialsProvider called. activeProfile={}", activeProfile);

            // property from command line
            String buildProfile = System.getProperty("build.profile");

            if ("dev".equalsIgnoreCase(activeProfile)) {
                String profileName = resolveConfigValue("aws.profile", "AWS_PROFILE");
                logger.info("app's activeProfile = {}, awsProfile = {}. Acquiring ProfileCredentialsProvider", activeProfile, profileName);
                currentCredentialsProvider = ProfileCredentialsProvider.builder()
                        .profileName(profileName)
                        .build();
            } else if ("dev".equals(buildProfile)) {
                String awsProfile = System.getProperty("aws.profile");
                logger.info("build.profile = {}, awsProfile = {}. Acquiring ProfileCredentialsProvider", buildProfile, awsProfile);
                currentCredentialsProvider = ProfileCredentialsProvider.builder()
                        .profileName(awsProfile)
                        .build();
            } else {
                logger.info("app's activeProfile = {}. Acquiring default credentials provider", activeProfile);
                currentCredentialsProvider = DefaultCredentialsProvider.builder().build();
            }

            logger.debug("Acquired AWS credentials provider: {}", currentCredentialsProvider);
            credentialsProvider = currentCredentialsProvider;
        }
        return credentialsProvider;
    }

    public static Region getRegion() {
        if (region == null) {
            logger.trace("Reading aws.region information from config");
            String regionStr = resolveConfigValue("aws.region", "AWS_REGION");
            if (regionStr == null || regionStr.isBlank()) {
                throw new IllegalStateException(
                        "Missing required configuration 'aws.region' (or AWS_REGION env variable).");
            }
            region = Region.of(regionStr);
            logger.info("aws.region = {}", region);
        }
        return region;
    }

    private static String getActiveProfile() {
        String profile = System.getProperty("spring.profiles.active");
        if (profile == null || profile.isBlank()) {
            profile = System.getenv("SPRING_PROFILES_ACTIVE");
        }
        if (profile == null || profile.isBlank()) {
            // Treat an unspecified profile as "prod"
            profile = "prod";
        }
        // Allow comma-separated profile list (Spring convention); pick the first
        int comma = profile.indexOf(',');
        return (comma >= 0 ? profile.substring(0, comma) : profile).trim();
    }

    /**
     * Resolve a configuration value, checking system properties first and environment
     * variables as fallback. Both Spring Boot dotted keys and POSIX-style uppercase
     * underscore keys are consulted.
     */
    private static String resolveConfigValue(String propertyKey, String envKey) {
        String value = System.getProperty(propertyKey);
        if (value == null || value.isBlank()) {
            value = System.getenv(envKey);
        }
        if (value == null || value.isBlank()) {
            // Also try dotted env style (rare but possible)
            value = System.getenv(propertyKey);
        }
        return value;
    }
}
