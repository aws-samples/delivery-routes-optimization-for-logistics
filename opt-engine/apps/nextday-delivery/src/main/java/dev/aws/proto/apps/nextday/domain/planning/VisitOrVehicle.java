/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning;

import dev.aws.proto.apps.nextday.location.Location;
import dev.aws.proto.apps.nextday.util.Constants;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.variable.InverseRelationShadowVariable;

@PlanningEntity
public interface VisitOrVehicle {

    Location getLocation();

    PlanningVehicle getPlanningVehicle();

    Integer getVisitIndex();

    Long getDeliveryDurationUntilNow();

    @InverseRelationShadowVariable(sourceVariableName = Constants.PreviousVisitOrVehicle)
    PlanningVisit getNextPlanningVisit();

    void setNextPlanningVisit(PlanningVisit nextPlanningVisit);


}
