/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Dispatch order configuration exposed through static accessors.
 *   - Values are supplied by a Spring-managed singleton (via constructor injection)
 *     and cached into static fields so that legacy static getters keep working.
 *   - System properties still take precedence for runtime overrides
 *     (e.g. -Dwarehouse-code=... on the CLI).
 */

package dev.aws.proto.apps.nextday.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class DispatchOrderConfig {
    private static final Logger logger = LoggerFactory.getLogger(DispatchOrderConfig.class);

    private static String warehouseCode;
    private static String orderDate;
    private static int maxContractedVehicles;
    private static int maxTimeGroups;

    public DispatchOrderConfig(
            @Value("${app.dispatch.config.warehouse-code:}") String warehouseCodeProp,
            @Value("${app.dispatch.config.order-date:}") String orderDateProp,
            @Value("${app.dispatch.config.max-contracted-vehicles:10}") int maxContractedVehiclesProp,
            @Value("${app.dispatch.config.max-time-groups:3}") int maxTimeGroupsProp) {

        warehouseCode = resolve("warehouse-code", warehouseCodeProp);
        orderDate = resolve("order-date", orderDateProp);
        maxContractedVehicles = maxContractedVehiclesProp;
        maxTimeGroups = maxTimeGroupsProp;

        logger.info("DispatchOrderConfig initialized: warehouseCode={}, orderDate={}, maxContractedVehicles={}, maxTimeGroups={}",
                warehouseCode, orderDate, maxContractedVehicles, maxTimeGroups);
    }

    private static String resolve(String name, String fallback) {
        String fromSysProp = System.getProperty(name);
        if (fromSysProp != null && !fromSysProp.isBlank()) {
            return fromSysProp;
        }
        if (fallback == null || fallback.isBlank()) {
            logger.warn("DispatchOrderConfig [{}] is not set or empty. Check system environments for running solution.", name);
            return null;
        }
        return fallback;
    }

    public static String getWarehouseCode() {
        return warehouseCode;
    }

    public static String getOrderDate() {
        return orderDate;
    }

    public static int getMaxContractedVehicles() {
        return maxContractedVehicles;
    }

    public static int getMaxTimeGroups() {
        return maxTimeGroups;
    }
}
