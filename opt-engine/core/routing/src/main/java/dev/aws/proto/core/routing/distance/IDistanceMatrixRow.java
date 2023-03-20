/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.routing.distance;

import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.location.ILocation;

public interface IDistanceMatrixRow {
    /**
     * Distance from this row's location to the given location.
     *
     * @param location target location
     * @return distance in units of the implemented class
     */
    Distance distanceTo(ILocation location);
}
