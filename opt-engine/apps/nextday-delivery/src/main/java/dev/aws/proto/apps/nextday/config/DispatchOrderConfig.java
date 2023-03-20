/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.config;

import io.quarkus.runtime.configuration.ProfileManager;
import lombok.Getter;
import org.eclipse.microprofile.config.ConfigProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DispatchOrderConfig {
    private static final Logger logger = LoggerFactory.getLogger(DispatchOrderConfig.class);

    @Getter
    private static final String warehouseCode = getSystemProperty("warehouse-code");

    @Getter
    private static final String orderDate = getSystemProperty("order-date");

    @Getter
    private static final int maxContractedVehicles = getConfigVariables("max-contracted-vehicles");

    @Getter
    private static final int maxTimeGroups = getConfigVariables("max-time-groups");

    private static String getSystemProperty(String name) {
        String activeProfile = ProfileManager.getActiveProfile();

        String value = System.getProperty(name);

        if(value == null || value.trim().length() == 0) {
            value = ConfigProvider.getConfig().getValue("app.dispatch.config."+name, String.class);
        }

        if(value == null || value.trim().length() == 0) {
            logger.error("DispatchOrderConfig [{}] is not set or empty!. Check system environments for running solution.");
            return null;
        } else {
            logger.info("Configuration [{}] == {}", name, value);
            return value;
        }
    }

    private static int getConfigVariables(String name) {
        String value = ConfigProvider.getConfig().getValue("app.dispatch.config."+name, String.class);
        int num = Integer.parseInt(value);
        logger.info("Configuration [{}] == {}", name, value);
        return num;
    }
}
