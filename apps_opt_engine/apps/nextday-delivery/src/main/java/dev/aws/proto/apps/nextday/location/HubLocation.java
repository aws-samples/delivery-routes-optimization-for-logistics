/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.location;

import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.location.LocationType;

public class HubLocation extends Location {
    public HubLocation(String id, Coordinate coordinate) {
        super(id, coordinate, LocationType.HUB);
    }
}
