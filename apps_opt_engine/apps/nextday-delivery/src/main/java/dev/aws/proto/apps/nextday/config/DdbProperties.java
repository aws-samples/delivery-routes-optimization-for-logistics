/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot notes:
 *   - Defined as a Java record bound via @ConfigurationProperties.
 *   - The DDB properties are SSM parameter names (not actual table names).
 *     They are keyed under the `app.ssmparams.ddb.*` property prefix.
 */
package dev.aws.proto.apps.nextday.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Map;

/**
 * DynamoDB config properties. Each value is the name of an SSM parameter whose value
 * holds the actual table / index name.
 */
@ConfigurationProperties(prefix = "app.ssmparams.ddb")
public record DdbProperties(Map<String, String> table,
                            Map<String, String> index) {

    public String deliveryJobsTableParameterName() {
        return table != null ? table.get("delivery-jobs") : null;
    }

    public String solverJobsTableParameterName() {
        return table != null ? table.get("solver-jobs") : null;
    }

    public String hubsTableParameterName() {
        return table != null ? table.get("hubs") : null;
    }

    public String vehicleCapacityTableParameterName() {
        return table != null ? table.get("vehicle-capacity") : null;
    }

    public String customerLocationsTableParameterName() {
        return table != null ? table.get("customer-locations") : null;
    }

    public String ordersTableParameterName() {
        return table != null ? table.get("orders") : null;
    }

    public String deliveryJobsTableSolverJobIdIndexParameterName() {
        return index != null ? index.get("delivery-jobs-solver-job-id") : null;
    }
}
