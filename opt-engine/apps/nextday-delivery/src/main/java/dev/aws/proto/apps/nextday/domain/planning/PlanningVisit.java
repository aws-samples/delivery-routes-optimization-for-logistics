/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning;

import dev.aws.proto.apps.nextday.domain.planning.solver.VisitIndexUpdatingVariableListener;
import dev.aws.proto.apps.nextday.location.Location;
import dev.aws.proto.apps.nextday.util.Constants;
import dev.aws.proto.core.Order;
import dev.aws.proto.core.routing.distance.Distance;
import lombok.Getter;
import lombok.Setter;
import org.optaplanner.core.api.domain.entity.PlanningEntity;
import org.optaplanner.core.api.domain.solution.cloner.DeepPlanningClone;
import org.optaplanner.core.api.domain.variable.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@PlanningEntity
public class PlanningVisit extends PlanningBase<String> implements VisitOrVehicle {
    private static final Logger logger = LoggerFactory.getLogger(PlanningVisit.class);

    private String warehouseCode;

    private Location location; // Customer location
    private String orderId;
    private int demands;

    // planning variables: changes during planning
    private VisitOrVehicle previousVisitOrVehicle;

    // shadow variables
    private PlanningVehicle planningVehicle;
    private PlanningVisit nextPlanningVisit;
    private Integer visitIndex;
    private Long deliveryDurationUntilNow;

    // getters/setters overrides

    private  String  deliveryCode;

    private  String  deliveryName;

    private  int  deliveryTimeGroup;

    private VisitOrder visitOrder;

    private double sumWeight;

    public PlanningVisit(String warehouseCode, String deliveryCode, String deliveryName, int deliveryTimeGroup, Location loc) {
        this.id = deliveryCode;
        this.warehouseCode = warehouseCode;
        this.deliveryCode = deliveryCode;
        this.deliveryName = deliveryName;
        this.deliveryTimeGroup = deliveryTimeGroup;
        this.location = loc;
    }
    public PlanningVisit() {

    }

    @Override
    public Location getLocation() {
        return this.location;
    }

    public String getLocationId(){
        return this.location.getId();
    }

    @DeepPlanningClone
    @PlanningVariable(
            valueRangeProviderRefs = {Constants.PlanningVehicleRange, Constants.PlanningVisitRange},
            graphType = PlanningVariableGraphType.CHAINED
    )
    public VisitOrVehicle getPreviousVisitOrVehicle() {
        return this.previousVisitOrVehicle;
    }

    @Override
    public PlanningVisit getNextPlanningVisit() {
        return this.nextPlanningVisit;
    }

    @AnchorShadowVariable(sourceVariableName = Constants.PreviousVisitOrVehicle)
    public PlanningVehicle getPlanningVehicle() {
        return this.planningVehicle;
    }

    @CustomShadowVariable(
            variableListenerClass = VisitIndexUpdatingVariableListener.class,
            sources = {@PlanningVariableReference(variableName = Constants.PreviousVisitOrVehicle)}
    )
    public Integer getVisitIndex() {
        return this.visitIndex;
    }

    public Long getDeliveryDurationUntilNow() {
        return this.deliveryDurationUntilNow;
    }

    public String getPlanningVehicleId() {
        return planningVehicle == null ?
                this.id + "-VEHICLE" : planningVehicle.getId();
    }

    @Override
    public int hashCode() {
        return super.id.hashCode();
    }

    @Override
    public String toString() {
        String prev = previousVisitOrVehicle == null ? "null" :
                previousVisitOrVehicle instanceof PlanningVehicle ? "Vehicle" + ((PlanningVehicle) previousVisitOrVehicle).getId() : ((PlanningVisit) previousVisitOrVehicle).getId();
        String next = nextPlanningVisit == null ? "null" : nextPlanningVisit.getShortId();

        String durationFromPrev = previousVisitOrVehicle == null ? "null" :
                previousVisitOrVehicle instanceof PlanningVehicle ?
                        String.valueOf(((PlanningVehicle) previousVisitOrVehicle).getLocation().distanceTo(this.getLocation()).getDistanceInSeconds()) :
                        String.valueOf(((PlanningVisit) previousVisitOrVehicle).getLocation().distanceTo(this.getLocation()).getDistanceInSeconds());

        return "[visit[" + getId() + "]] [idx=" + visitIndex + "]\t[durFromPrev= " + durationFromPrev + "]\t[prev = " + prev + "][next = " + next + "]\t[demand = "+demands+"]";
    }

    public int scoreForDistanceFromPreviousVisitOrVehicle() {
        if (previousVisitOrVehicle == null) {
            throw new IllegalStateException("This method should not be called when the previousVisitOrDriver is not initialized yet.");
        }

        Distance distance = this.location.distanceTo(previousVisitOrVehicle.getLocation());

        return (int) (distance.getDistanceInMeters() * distance.getDistanceInSeconds());
    }

    public boolean isLastVisit() {
        return this.nextPlanningVisit == null;
    }

    public int scoreForDistanceFromLastVisitToHub() {
        if (!isLastVisit()) {
            throw new IllegalStateException("This method should not be called when this visit is not the last one");
        }

        Distance distance = this.location.distanceTo(this.getPlanningVehicle().getLocation());
        return (int) (distance.getDistanceInMeters() * distance.getDistanceInSeconds());
    }

    public int scoreForMaxDurationOfDeliveryJob() {
        int secDiff = (int) (this.deliveryDurationUntilNow - Constants.MaxDurationOfDeliveryJobInSeconds);
        return Math.max(secDiff, 0);
    }


}
