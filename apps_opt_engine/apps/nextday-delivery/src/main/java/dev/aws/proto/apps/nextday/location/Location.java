/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.location;

import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.location.LocationType;
import lombok.NoArgsConstructor;
import org.optaplanner.core.api.domain.lookup.PlanningId;

@NoArgsConstructor
public class Location extends dev.aws.proto.core.routing.location.LocationBase<Distance> {
    public Location(String id, Coordinate coordinate, LocationType locationType) {
        super(id, coordinate, locationType);
    }

    @PlanningId
    @Override
    public String getId() {
        return super.getId();
    }
}
