/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning;

import dev.aws.proto.apps.nextday.domain.planning.capacity.MaxCapacity;
import dev.aws.proto.apps.nextday.location.Location;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Getter
@Setter
@NoArgsConstructor
public class PlanningVehicle extends PlanningBase<String> implements VisitOrVehicle {

    private static final Logger logger = LoggerFactory.getLogger(PlanningVehicle.class);

    private String carNo; 
    
    private MaxCapacity maxCapacity;


    private String warehouseCode;

    private Location location; // start location (by default : warehouse)
    
    // shadow variables
    private PlanningVisit nextPlanningVisit;

    private String carGrade;

    private int timeGroup;

    private boolean isCompanyOwnedVehicle = true; // true : 회사차 , false : 임시차

    // overrides
    @Override
    public Location getLocation() {
        return this.location;
    }

    @Override
    public PlanningVehicle getPlanningVehicle() {
        return this;
    }

    public PlanningVehicle(String id, String warehouseCode, String carNo, MaxCapacity maxCapacity , String carGrade, boolean isCompanyOwnedVehicle) {
        this.id = id;
        this.warehouseCode = warehouseCode;
        this.carNo = carNo;
        this.maxCapacity = maxCapacity;
        this.carGrade = carGrade;
        this.isCompanyOwnedVehicle = isCompanyOwnedVehicle;
    }

    public PlanningVehicle(String id, String warehouseCode, String carNo, MaxCapacity maxCapacity , String carGrade , int timeGroup, boolean isCompanyOwnedVehicle) {
        this.id = id;
        this.carNo = carNo;
        this.maxCapacity = maxCapacity;
        this.carGrade = carGrade;
        this.timeGroup = timeGroup;
        this.isCompanyOwnedVehicle = isCompanyOwnedVehicle;
    }

    @Override
    public Integer getVisitIndex() {
        return 0;
    }

    @Override
    public Long getDeliveryDurationUntilNow() {
        return 0L;
    }

    @Override
    public PlanningVisit getNextPlanningVisit() {
        return this.nextPlanningVisit;
    }

    @Override
    public int hashCode() {
        return super.id.hashCode();
    }

    public long chainLength() {
        long len = 0;
        PlanningVisit visit = this.getNextPlanningVisit();

        while (visit != null) {
            len++;
            visit = visit.getNextPlanningVisit();
        }
        return len;
    }
}
