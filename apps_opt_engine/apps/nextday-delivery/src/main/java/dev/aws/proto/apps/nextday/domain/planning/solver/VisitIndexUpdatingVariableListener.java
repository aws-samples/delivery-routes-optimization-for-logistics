/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning.solver;

import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.apps.nextday.domain.planning.VisitOrVehicle;
import dev.aws.proto.apps.nextday.planner.solution.DispatchSolution;
import org.optaplanner.core.api.domain.variable.VariableListener;
import org.optaplanner.core.api.score.director.ScoreDirector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;

public class VisitIndexUpdatingVariableListener implements VariableListener<DispatchSolution, PlanningVisit> {
    private static final Logger logger = LoggerFactory.getLogger(VisitIndexUpdatingVariableListener.class);

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

        if (previousVisitOrVehicle == null) {
            visitIdx = null;
        } else {
            visitIdx = previousVisitOrVehicle.getVisitIndex();

            if (visitIdx != null) {
                visitIdx++;
            }
        }

        PlanningVisit shadowVisit = sourceVisit;

        while (shadowVisit != null && !Objects.equals(shadowVisit.getVisitIndex(), visitIdx)) {
            scoreDirector.beforeVariableChanged(shadowVisit, "visitIndex");
            shadowVisit.setVisitIndex(visitIdx);
            scoreDirector.afterVariableChanged(shadowVisit, "visitIndex");

            shadowVisit = shadowVisit.getNextPlanningVisit();
            if (visitIdx != null) {
                visitIdx++;
            }
        }
    }
}
