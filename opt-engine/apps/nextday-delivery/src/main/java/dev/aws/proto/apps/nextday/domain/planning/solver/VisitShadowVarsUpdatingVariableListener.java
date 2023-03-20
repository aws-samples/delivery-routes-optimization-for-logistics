/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning.solver;

import dev.aws.proto.apps.nextday.planner.solution.DispatchSolution;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.apps.nextday.domain.planning.VisitOrVehicle;
import dev.aws.proto.core.routing.distance.Distance;
import org.optaplanner.core.api.domain.variable.VariableListener;
import org.optaplanner.core.api.score.director.ScoreDirector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;

public class VisitShadowVarsUpdatingVariableListener implements VariableListener<DispatchSolution, PlanningVisit> {
    private static final Logger logger = LoggerFactory.getLogger(VisitShadowVarsUpdatingVariableListener.class);

    @Override
    public void beforeEntityAdded(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit planningVisit) {
        // do nothing
    }

    @Override
    public void afterEntityAdded(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit planningVisit) {
        updateVisit(scoreDirector, planningVisit);
    }

    @Override
    public void beforeVariableChanged(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit planningVisit) {
        // do nothing
    }

    @Override
    public void afterVariableChanged(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit planningVisit) {
        updateVisit(scoreDirector, planningVisit);
    }

    @Override
    public void beforeEntityRemoved(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit planningVisit) {
        // do nothing
    }

    @Override
    public void afterEntityRemoved(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit planningVisit) {
        // do nothing
    }

    private void updateVisit(ScoreDirector<DispatchSolution> scoreDirector, PlanningVisit sourceVisit) {
        VisitOrVehicle previousVisitOrVehicle = sourceVisit.getPreviousVisitOrVehicle();

        Integer visitIdx;
        Long deliveryDurationUntilNow;


        if (previousVisitOrVehicle == null) { // sourceVisit didn't have a prev assigned
            visitIdx = null;
            deliveryDurationUntilNow = 0L;
        } else { // sourceVisit was a visit
            visitIdx = previousVisitOrVehicle.getVisitIndex();
            deliveryDurationUntilNow = previousVisitOrVehicle.getDeliveryDurationUntilNow();

            if (visitIdx != null) { // sourceVisit was the first visit, so its previous was the driver that has null visitIdx
                visitIdx++;
            }

            if (deliveryDurationUntilNow != null) {
                deliveryDurationUntilNow += previousVisitOrVehicle.getLocation().distanceTo(sourceVisit.getLocation()).getDistanceInSeconds();
            }
        }
//        logger.debug("visitIdx = {}, deliveryDur = {}", visitIdx, deliveryDurationUntilNow);

        // --------
        // update the visitIndex shadow variable

        // maintain a reference to the previous item in the chain
        PlanningVisit shadowVisit = sourceVisit;

        // until we reach the end of the chain AND visitIdx_prev != visitIdx_curr
        while (shadowVisit != null && !Objects.equals(shadowVisit.getVisitIndex(), visitIdx)) {
            // change the visitIndex of the current node
            scoreDirector.beforeVariableChanged(shadowVisit, "visitIndex");
            shadowVisit.setVisitIndex(visitIdx);
            scoreDirector.afterVariableChanged(shadowVisit, "visitIndex");

            // move to the next node in the chain
            shadowVisit = shadowVisit.getNextPlanningVisit();
            if (visitIdx != null) {
                visitIdx++;
            }
        }

        // -----------
        // update the deliveryDurationUntilNow shadow variable

        VisitOrVehicle previousShadowVisit = previousVisitOrVehicle;
        PlanningVisit currentShadowVisit = sourceVisit;

        while (previousShadowVisit != null && currentShadowVisit != null && !Objects.equals(previousShadowVisit.getDeliveryDurationUntilNow(), deliveryDurationUntilNow)) {
            // update the variable on current
            scoreDirector.beforeVariableChanged(currentShadowVisit, "deliveryDurationUntilNow");
            currentShadowVisit.setDeliveryDurationUntilNow(deliveryDurationUntilNow);
            scoreDirector.afterVariableChanged(currentShadowVisit, "deliveryDurationUntilNow");

            // move the pointers together to next
            previousShadowVisit = currentShadowVisit;
            currentShadowVisit = currentShadowVisit.getNextPlanningVisit();

            // update the value
            if (deliveryDurationUntilNow != null && currentShadowVisit != null) {
                Distance distance = previousShadowVisit.getLocation().distanceTo(currentShadowVisit.getLocation());
                deliveryDurationUntilNow += distance.getDistanceInSeconds();
            }
        }
    }
}
