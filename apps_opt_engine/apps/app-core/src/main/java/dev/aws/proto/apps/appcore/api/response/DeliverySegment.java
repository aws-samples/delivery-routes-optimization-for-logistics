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

    /** Type of the segment. */
    public enum SegmentType {
        TO_ORIGIN,
        TO_DESTINATION,
        TO_HUB,
        TO_WAREHOUSE,
    }

    private String orderId;

    /** Index of the segment within the assignment. */
    private int index;

    private Coordinate from;
    private Coordinate to;

    private SegmentType segmentType;

    /** Distance information and encoded polyline for the routing points. */
    private Segment route;

    private String deliveryCode;
    private String deliveryName;
    private String demands;
    private String deliveryTimeGroup;
}
