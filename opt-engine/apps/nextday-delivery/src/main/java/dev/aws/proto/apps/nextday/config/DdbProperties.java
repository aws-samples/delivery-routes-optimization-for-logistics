/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.config;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithName;

/**
 * DynamoDB Config Properties
 */
@ConfigMapping(prefix = "app.ssmparams.ddb")
public interface DdbProperties {
    @WithName("table.delivery-jobs")
    String deliveryJobsTableParameterName();

    @WithName("table.solver-jobs")
    String solverJobsTableParameterName();

    @WithName("table.hubs")
    String hubsTableParameterName();

    @WithName("table.vehicle-capacity")
    String vehicleCapacityTableParameterName();

    @WithName("table.customer-locations")
    String customerLocationsTableParameterName();

    @WithName("table.orders")
    String ordersTableParameterName();

    @WithName("index.delivery-jobs-solver-job-id")
    String deliveryJobsTableSolverJobIdIndexParameterName();
}
