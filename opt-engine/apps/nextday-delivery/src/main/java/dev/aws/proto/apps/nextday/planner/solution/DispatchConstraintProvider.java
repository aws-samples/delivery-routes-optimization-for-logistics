/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.planner.solution;

import dev.aws.proto.apps.nextday.domain.planning.PlanningVehicle;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import org.optaplanner.core.api.score.buildin.hardmediumsoftlong.HardMediumSoftLongScore;
import org.optaplanner.core.api.score.stream.Constraint;
import org.optaplanner.core.api.score.stream.ConstraintFactory;
import org.optaplanner.core.api.score.stream.ConstraintProvider;
import org.optaplanner.core.api.score.stream.Joiners;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.optaplanner.core.api.score.stream.ConstraintCollectors.*;

public class DispatchConstraintProvider implements ConstraintProvider {

    // Distance limit for one trip (50km)
    final int MAX_DISTANCE_AT_ONCE = 50*1000;

    // Visit limit for one trip
    final int MAX_NUM_OF_DESTINATIONS_AT_ONCE = 5;

    // Minimum load ratio for one vehicle
    final double MIN_LOAD_WEIGHT_RATIO = 0.7;

    /**
     * We define the constraints here.
     * <p>
     * IMPORTANT to note, that the outcome will depend on the _order_ of the constraints in this list - at least that are on the same "level".
     * <p>
     * Check out the docs for constraint steams here: {@see https://www.optaplanner.org/docs/optaplanner/latest/constraint-streams/constraint-streams.html}
     *
     * heuristics : {@see https://www.optaplanner.org/docs/optaplanner/latest/construction-heuristics/construction-heuristics.html}
     */
    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[]{
            // << Vehicle Capacity >>---------------------------------------------------------------
            // [HARD] Over-loaded, Max capacity by vehicles
            vehicleCapacity(constraintFactory),
            // [MEDIUM] Too little load (70% below)
            vehicleCapacityLow(constraintFactory),

            // << Trip distance >>------------------------------------------------------------------
            // [SOFT] Penalty by distance
            distanceFromPreviousVisitOrVehicle(constraintFactory),
            distanceFromLastVisitToDepot(constraintFactory),
            // [HARD] Trip limits at once (50km)
            distanceLimitByDelivery(constraintFactory),
            // [MEDIUM] Visit limits by single trip
            visitCountLimitByDelivery(constraintFactory),

            // << Bundled delivery >>-----------------------------------------------------------------
            // [MEDIUM] Bundled order delivered by single vehicle
            visitToSameCustomerLocation(constraintFactory),
            // [HARD] Bundled order separated, The bundled order can be loaded largest vehicle case
            visitToSameCustomerLocationPreventSplit(constraintFactory),
            // [HARD] Bundled order unloaded at once. there are no other customer's orders between bundled orders.
            visitToSameCustomerAtOnce(constraintFactory),

            // << Requested delivery time group >>----------------------------------------------------
            // [HARD] Late delivery, every order delivers within required time group
            vehicleTimeGroup(constraintFactory),

            // << Vehicle priority >>-----------------------------------------------------------------
            // [HARD] Company owned vehicle dispatched first
            vehicleGrade(constraintFactory),
        };
    }

    // [HARD] Over-loaded, Max capacity by vehicles
    protected Constraint vehicleCapacity(ConstraintFactory factory) {
        return factory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by vehicles, and find sum of loaded orders by vehicle
                .groupBy(PlanningVisit::getPlanningVehicle, sum(PlanningVisit::getDemands))

                // Pick vehicles which has over-loaded
                .filter((vehicle, demand) -> demand > vehicle.getMaxCapacity().getWeight())

                // Penalize by over-loaded weights
                .penalizeLong(
                        "vehicle capacity - HARD score",
                        HardMediumSoftLongScore.ONE_HARD,
                        (vehicle, demand) -> demand - vehicle.getMaxCapacity().getWeight());
    }

    // [MEDIUM] Too little load (70% below)
    protected Constraint vehicleCapacityLow(ConstraintFactory factory) {
        return factory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by vehicles, and find sum of loaded orders by vehicle
                .groupBy(PlanningVisit::getPlanningVehicle, sum(PlanningVisit::getDemands))

                // Pick vehicles which loaded 70% below
                .filter((vehicle, totalLoads) -> totalLoads < vehicle.getMaxCapacity().getWeight()*MIN_LOAD_WEIGHT_RATIO)

                // Penalize by over-loaded weights (1 medium points per 1000 weights)
                .penalizeLong(
                        "vehicle load low - MEDIUM score",
                        HardMediumSoftLongScore.ONE_MEDIUM,
                        (vehicle, totalLoads) -> (1 + (vehicle.getMaxCapacity().getWeight()-totalLoads)/1000)
                );
    }

    // [SOFT] Penalty by distance : warehouse -> 1st visit -> ... -> last visit
    protected Constraint distanceFromPreviousVisitOrVehicle(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)
                // Penalize by distance values which are sum of all visit distances from warehouse to last visit
                .penalizeLong(
                        "distance from previous visit - SOFT score",
                        HardMediumSoftLongScore.ONE_SOFT,
                        PlanningVisit::scoreForDistanceFromPreviousVisitOrVehicle);
    }

    // [SOFT] Penalty by distance : last visit -> return to warehouse
    protected Constraint distanceFromLastVisitToDepot(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)
                // Pick last visits
                .filter(PlanningVisit::isLastVisit)
                // Penalize by distance values from last visit to warehouse
                .penalizeLong(
                        "distance from last visit to depot - SOFT score",
                        HardMediumSoftLongScore.ONE_SOFT,
                        PlanningVisit::scoreForDistanceFromLastVisitToHub);
    }

    // [HARD] Trip limits at once (50km)
    protected Constraint distanceLimitByDelivery(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by vehicles
                .groupBy(PlanningVisit::getPlanningVehicleId, toList())

                // Penalize if the vehicle has too-long trip
                .penalizeLong(
                        "distance from distance limit - HARD score",
                        HardMediumSoftLongScore.ONE_HARD,
                        (vehicleId, visitList) -> { // vehicleId : CarNo, visitList : visit sequences for the vehicle
                            // find round-trip distance starts from warehouse and deliver all orders and back to warehouse
                            long dist = visitList.stream()
                                    .mapToLong( v -> {
                                        // partial distance
                                        long partDist = v.getLocation().distanceTo(v.getPreviousVisitOrVehicle().getLocation()).getDistanceInMeters();
                                        // if last visit, add return distance
                                        if(v.isLastVisit()) partDist += v.getLocation().distanceTo(v.getPlanningVehicle().getLocation()).getDistanceInMeters();
                                        return partDist;
                                    })
                                    .sum();

                            // penalize if the vehicle has too-long trip, one hard scores by 10km each.
                            if(dist > MAX_DISTANCE_AT_ONCE) {
                                return 1L + (dist- MAX_DISTANCE_AT_ONCE)/10000;
                            } else {
                                return 0;
                            }
                        });
    }

    // [MEDIUM] Visit limits by single trip
    protected Constraint visitCountLimitByDelivery(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by vehicle
                .groupBy(PlanningVisit::getPlanningVehicleId, toList())

                // Penalize if too many orders in one vehicle
                .penalizeLong(
                        "visit count limit at once - MEDIUM score",
                        HardMediumSoftLongScore.ONE_MEDIUM,
                        (vehicleId, visitList) -> { // vehicleId : CarNo, visitList : visit sequence of loaded order

                            // find visits (except bundled delivery)
                            int locations = visitList.stream().map(PlanningVisit::getLocationId).collect(Collectors.toSet()).size();

                            // Penalize if visit count exceed limits
                            if(locations > MAX_NUM_OF_DESTINATIONS_AT_ONCE) {
                                return (locations - MAX_NUM_OF_DESTINATIONS_AT_ONCE) * 100L;
                            } else {
                                return 0;
                            }
                        });
    }

    // [MEDIUM] Bundled order delivered by single vehicle
    protected Constraint visitToSameCustomerLocation(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by delivery location (destination)
                .groupBy(PlanningVisit::getLocationId, toList())

                // find bundled order
                .filter((locId, visitList) -> visitList.size() >= 2)

                // Penalize if bundled orders are loaded 2 or more vehicles
                // 1. get vehicle id for each visit         visitList.stream().map(v->v.getPlanningVehicleId())
                // 2. remove duplicate vehicle id                                       .collect(Collectors.toSet())
                // 3. Penalize vehicle count -1, it means penalize 2 or more vehicles   .size() - 1
                .penalizeLong(
                        "same customer - MEDIUM score",
                        HardMediumSoftLongScore.ONE_MEDIUM,
                        (locId, visitList) -> (visitList.stream().map(PlanningVisit::getPlanningVehicleId).collect(Collectors.toSet()).size() - 1) * 1000L);
    }

    // [HARD] Bundled order unloaded at once. there are no other customer's orders between bundled orders.
    protected Constraint visitToSameCustomerAtOnce(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by delivery location (destination)
                .groupBy(PlanningVisit::getLocationId, PlanningVisit::getPlanningVehicleId, toList())

                // find bundled order
                .filter((locId, vehicleId, visitList) -> visitList.size() >= 2)

                // find the visit order in other customer's bundled order
                .filter((locId, vehicleId, visitList) -> {
                        // The count of previous locations have to be 2, if these are correct bundled order
                        // previous location + bundled order location(duplication removed) = 2
                        Set<String> previousVisitList = visitList.stream().map(PlanningVisit::getPreviousVisitOrVehicle).map(v -> {
                            if (v instanceof PlanningVisit) return ((PlanningVisit) v).getDeliveryCode();
                            else if (v instanceof PlanningVehicle) return ((PlanningVehicle) v).getWarehouseCode();
                            else throw new IllegalArgumentException(v.getClass() + " is not a VisitOrVehicle");
                        }).collect(Collectors.toSet());
                        previousVisitList.add(locId);

                        // It considers the other exist between bundled orders, if previous visit locations are 3 or more
                        return previousVisitList.size() > 2;
                    }
                )

                // Penalize hard for separated visits for the bundled order
                .penalizeLong(
                        "same customer visit at once - HARD score",
                        HardMediumSoftLongScore.ONE_HARD,
                        (locId, vehicleId, visitList) -> visitList.size());
    }

    // [HARD] Bundled order separated, The bundled order can be loaded largest vehicle case
    protected Constraint visitToSameCustomerLocationPreventSplit(ConstraintFactory constraintFactory) {
        return constraintFactory
                // Get all visits
                .forEach(PlanningVisit.class)

                // Aggregate by delivery location (destination)
                .groupBy(PlanningVisit::getLocationId, toList())

                // find bundled order
                .filter((locId, visitList) -> visitList.size() >= 2)

                // penalize if bundled order separated if these can be loaded on largest single vehicle
                .penalizeLong(
                        "same customer - HARD score",
                        HardMediumSoftLongScore.ONE_HARD,
                        (locId, visitList) -> { // locId:대리점ID, visitList:해당 대리점으로 가는 배송목록(주문)
                            // Get vehicles which contains bundled order
                            List<PlanningVehicle> vehicles = visitList.stream().map(PlanningVisit::getPlanningVehicle).collect(Collectors.toList());

                            // find the largest vehicle of bundled orders
                            PlanningVehicle pv = vehicles.stream().max(Comparator.comparingInt(a -> a.getMaxCapacity().getWeight())).orElseThrow();

                            // max capacity of the largest vehicle
                            int maxCapacity = pv.getMaxCapacity().getWeight();
                            // number of vehicles for the bundled order
                            int numOfVehicles = new HashSet<>(vehicles).size();
                            // sum weight of the bundled order
                            int totalDemands = visitList.stream().mapToInt(PlanningVisit::getDemands).sum();

                            // penalize hard
                            // if the bundled separated by 2 or more vehicle,
                            // and largest vehicle can be load bundled order at once
                            if(numOfVehicles >=2 && totalDemands <= maxCapacity) return 1;
                            else return 0;
                        });
    }

    // [HARD] Late delivery, every order delivers within required time group
   protected Constraint vehicleTimeGroup(ConstraintFactory factory) { // 회차확인
       return factory
               // Get all visits
               .forEach(PlanningVisit.class)

               // Penalize if late
               .penalizeLong(
                       "vehicleTimeGroup",
                       HardMediumSoftLongScore.ONE_HARD,
                       (visit) -> {
                           // Requested time group
                           int visitTimeGroup = visit.getDeliveryTimeGroup();
                           // Dispatched time group by optimizer
                           int vehicleTimeGroup = visit.getPlanningVehicle().getTimeGroup();

                           // penalize if late delivery
                           if (visitTimeGroup < vehicleTimeGroup)return 1;
                           else return 0;
                       });
   }

    // [HARD] Company owned vehicle dispatched first
    protected Constraint vehicleGrade(ConstraintFactory factory) {
        return factory
                // Get all vehicles
                .forEach(PlanningVehicle.class)

                // find company owned vehicle
                .filter((order) -> !order.getPlanningVehicle().isCompanyOwnedVehicle() )

                // Aggregate dispatched vehicles by same time group
                .join(PlanningVehicle.class, Joiners.equal(PlanningVehicle::getTimeGroup))

                // Penalize if temporary contracted vehicle used before company owned vehicle dispatched
                .penalize(
                        "company owned vehicle first",
                        HardMediumSoftLongScore.ONE_HARD,
                        (v1,v2) -> { // v1: temporary contracted vehicle, v2: the vehicle which are planned same time group with v1
                            if(v1.getNextPlanningVisit() != null && v2.getPlanningVehicle().isCompanyOwnedVehicle() && v2.getNextPlanningVisit() == null)
                                return 1;
                            else
                                return 0;
                        }
                );
    }
}
