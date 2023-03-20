/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.api.response;

import dev.aws.proto.core.routing.location.Coordinate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a delivery segment which is part of an order assignment for a driver.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliverySegment {

    /**
     * Type of the segment.
     */
    public static enum SegmentType {
        TO_ORIGIN,
        TO_DESTINATION,
        TO_HUB,

        TO_WAREHOUSE,
    }

    /**
     * ID of the order
     */
    private String orderId;

    /**
     * The index of the segment. ith element of the segment list in the assignment.
     */
    private int index;

    /**
     * Coordinate where the segment starts from.
     */
    private Coordinate from;

    /**
     * Coordinate where the segment ends.
     */
    private Coordinate to;

    /**
     * The type of the segment.
     */
    private DeliverySegment.SegmentType segmentType;

    /**
     * The route for this segment.
     * Includes distance information and an encoded string representation for the routing points on the map.
     */
    private Segment route;

    private String deliveryCode;

    private String deliveryName;

    private String demands;

    private String deliveryTimeGroup;
}

