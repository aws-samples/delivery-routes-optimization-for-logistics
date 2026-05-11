/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning;

import dev.aws.proto.core.routing.location.Coordinate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PlanningHub extends PlanningBase<String> {
    private String name;
    private Coordinate coordinate;

    public PlanningHub(String id, String name, Coordinate coordinate) {
        this.id = id;
        this.name = name;
        this.coordinate = coordinate;
    }

    @Override
    public String toString() {
        return name + " | vehicles = " + coordinate;
    }
}
