/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.util;

import java.time.format.DateTimeFormatter;

/**
 * Helper class to hold constant values.
 */
public class Constants {
    public static final DateTimeFormatter DATETIMEFORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static final String PreviousVisitOrVehicle = "previousVisitOrVehicle";
    public static final String PlanningVehicleRange = "PlanningVehicleRange";
    public static final String PlanningVisitRange = "PlanningVisitRange";

    public static final int MaxDurationOfDeliveryJobInSeconds;

    static {
        MaxDurationOfDeliveryJobInSeconds = 7200; // 2 hours
    }

    private Constants() {
        throw new AssertionError("Utility class");
    }
}
