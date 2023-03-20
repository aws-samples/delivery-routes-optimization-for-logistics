/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.api.response;

import dev.aws.proto.apps.appcore.api.response.DeliverySegment;
import dev.aws.proto.apps.appcore.api.response.Segment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * A delivery job represents a delivery route that is serving a list of orders
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryJob {
    /**
     * Delivery Job ID
     */
    private UUID id;

    /**
     * The timestamp of the dispatching request.
     */
    private long createdAt;

    /**
     * The solver job ID (problemID) that created this delivery job.
     */
    private UUID solverJobId;

    /**
     * List of routing segments.
     */
    private List<DeliverySegment> segments;

    /**
     * The segment route representation of all the segments (whole assignment).
     */
    private Segment route;

    private String vehicleId;

    private String carNo;

    private String deliveryTimeGroup;

    private String loadCapacity;

    private String maxCapacity;
}
