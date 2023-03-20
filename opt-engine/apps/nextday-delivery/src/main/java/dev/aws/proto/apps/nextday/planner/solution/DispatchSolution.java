/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.planner.solution;

import dev.aws.proto.apps.appcore.planner.solution.DispatchSolutionBase;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVehicle;
//import dev.aws.proto.apps.nextday.domain.planning.DeliveryRide;
import dev.aws.proto.apps.nextday.domain.planning.PlanningHub;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.apps.nextday.location.Location;
import dev.aws.proto.apps.nextday.util.Constants;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.optaplanner.core.api.domain.solution.PlanningEntityCollectionProperty;
import org.optaplanner.core.api.domain.solution.PlanningScore;
import org.optaplanner.core.api.domain.solution.PlanningSolution;
import org.optaplanner.core.api.domain.solution.ProblemFactCollectionProperty;
import org.optaplanner.core.api.domain.valuerange.ValueRangeProvider;
import org.optaplanner.core.api.score.buildin.hardmediumsoftlong.HardMediumSoftLongScore;

import java.util.List;

@PlanningSolution
@Data
@NoArgsConstructor
@SuperBuilder
public class DispatchSolution extends DispatchSolutionBase<HardMediumSoftLongScore> {

    private List<PlanningVehicle> planningVehicles;
    private List<PlanningVisit> planningVisits; // destinations of orders

    private List<Location> locations; // Location information for all visit points
    private List<PlanningHub> hubs; // warehouse information

    @Getter
    private String warehouseCode;

    @Getter
    private String warehouseName;

    @Getter
    private String orderDate;

    @PlanningScore
    @Getter
    @Setter
    public HardMediumSoftLongScore score;

    @PlanningEntityCollectionProperty
    @ValueRangeProvider(id = Constants.PlanningVisitRange)
    public List<PlanningVisit> getPlanningVisits() {
        return this.planningVisits;
    }

    @ProblemFactCollectionProperty
    @ValueRangeProvider(id = Constants.PlanningVehicleRange)
    public List<PlanningVehicle> getPlanningVehicles() {
        return this.planningVehicles;
    }

    @ProblemFactCollectionProperty
    public List<Location> getLocations() {
        return this.locations;
    }

    @ProblemFactCollectionProperty
    public List<PlanningHub> getHubs() {
        return this.hubs;
    }

}
