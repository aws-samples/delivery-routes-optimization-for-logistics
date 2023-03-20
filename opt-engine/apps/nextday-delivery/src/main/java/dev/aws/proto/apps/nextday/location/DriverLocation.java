/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.location;

import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.location.LocationType;

public class DriverLocation extends Location {
    public DriverLocation(String id, Coordinate coordinate) {
        // TODO: consider using a dedicated LocationType in the future, esp when using geocluster centroid as "depot"
        super(id, coordinate, LocationType.MOVING_LOCATION);
    }
}
