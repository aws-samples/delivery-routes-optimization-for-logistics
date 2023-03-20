/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.api.response;

import dev.aws.proto.core.routing.distance.DistanceMatrix;
import lombok.Data;
import lombok.experimental.SuperBuilder;

@Data
@SuperBuilder
public class SolverJob extends dev.aws.proto.apps.appcore.api.response.DispatchResult {
    /**
     * Execution ID of the step function that triggered the dispatch request.
     */
    private String executionId;

    /**
     * Distance matrix metric information.
     */
    private DistanceMatrix.Metrics distanceMatrixMetrics;

    private String warehouseCode;

    private String warehouseName;

    private String orderDate;

    private int orderCount = -1;
}
