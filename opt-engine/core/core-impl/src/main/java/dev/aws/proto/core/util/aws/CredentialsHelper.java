/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.util.aws;

import io.quarkus.runtime.configuration.ProfileManager;
import org.eclipse.microprofile.config.ConfigProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;

public class CredentialsHelper {
    private static Logger logger = LoggerFactory.getLogger(CredentialsHelper.class);

    private static Region region;
    private static AwsCredentialsProvider credentialsProvider;

    private CredentialsHelper() {
        // don't allow to instantiate this class
    }

    public static AwsCredentialsProvider getCredentialsProvider() {
        if (credentialsProvider == null) {
            AwsCredentialsProvider currentCredentialsProvider;
            String activeProfile = ProfileManager.getActiveProfile();

            logger.trace("getCredentialsProvider called. activeProfile={}", activeProfile);

            // property from command line
            String buildProfile = System.getProperty("build.profile");

            if (activeProfile.equalsIgnoreCase("dev")) {

                String profileName = ConfigProvider.getConfig().getValue("aws.profile", String.class);
                logger.info("app's activeProfile = {}, awsProfile = {}. Acquiring ProfileCredentialsProvider", activeProfile, profileName);
                currentCredentialsProvider = ProfileCredentialsProvider.builder()
                        .profileName(profileName)
                        .build();
            } else if("dev".equals(buildProfile)) {
                String awsProfile = System.getProperty("aws.profile");
                logger.info("app's activeProfile = {}, awsProfile = {}. Acquiring ProfileCredentialsProvider", buildProfile, awsProfile);
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
            String regionStr = ConfigProvider.getConfig().getValue("aws.region", String.class);
            region = Region.of(regionStr);
            logger.info("aws.region = {}", region);
        }
        return region;
    }

}
