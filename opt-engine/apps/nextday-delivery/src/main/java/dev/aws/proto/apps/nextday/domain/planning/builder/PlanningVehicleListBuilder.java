/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning.builder;

import dev.aws.proto.apps.nextday.domain.planning.PlanningVehicle;
import dev.aws.proto.apps.nextday.domain.planning.capacity.MaxCapacity;
import dev.aws.proto.apps.nextday.location.HubLocation;

import java.util.ArrayList;
import java.util.List;

public class PlanningVehicleListBuilder {

    private List<PlanningVehicle> vehicles;

    private int contractedVehicles = 0;

    private final MaxCapacity TEMP_VEHICLE_CAPACITY = MaxCapacity.builder().weight(20000).build();
    private String TEMP_VEHICLE_GRADE = "2.5 Ton";

    private int maxTimeGroup = 1;

    private HubLocation hubLocation;

    private PlanningVehicleListBuilder(List<PlanningVehicle> vehicles) {
        this.vehicles = vehicles;
    }

    public static PlanningVehicleListBuilder builder(List<PlanningVehicle> vehicles) {
        return new PlanningVehicleListBuilder(vehicles);
    }

    public PlanningVehicleListBuilder setContractedVehicles(int contractedVehicles) {
        this.contractedVehicles = contractedVehicles;
        return this;
    }

    public PlanningVehicleListBuilder setMaxTimeGroup(int maxTimeGroup) {
        this.maxTimeGroup = maxTimeGroup;
        return this;
    }

    public PlanningVehicleListBuilder setHubLocation(HubLocation hubLocation) {
        this.hubLocation = hubLocation;
        return this;
    }

    public List<PlanningVehicle> build(){
        List<PlanningVehicle> vehicleList = new ArrayList<>();

        for(int t = 1 ; t <= maxTimeGroup ; t++) {
            // Company owned car
            for(PlanningVehicle v : vehicles) {
                PlanningVehicle vehicle = new PlanningVehicle(
                        v.getId()+t,
                        v.getWarehouseCode(),
                        v.getCarNo(),
                        v.getMaxCapacity(),
                        v.getCarGrade(),
                        t,
                        v.isCompanyOwnedVehicle());
                vehicle.setLocation(hubLocation);
                vehicleList.add(vehicle);
            }

            // Instant contracted car
            String tempWarehouse = (vehicles == null || vehicles.isEmpty()) ? "TEMP_WAREHOUSE" : vehicles.get(0).getWarehouseCode();
            for(int c = 0 ; c < contractedVehicles ; c++) {
                String tempCarNo = "TMP"+c;
                PlanningVehicle vehicle = new PlanningVehicle(
                        tempCarNo+"-"+t,
                        tempWarehouse,
                        tempCarNo,
                        TEMP_VEHICLE_CAPACITY,
                        TEMP_VEHICLE_GRADE,
                        t,
                        false);
                vehicle.setLocation(hubLocation);
                vehicleList.add(vehicle);
            }
        }

        return vehicleList;
    }
}
