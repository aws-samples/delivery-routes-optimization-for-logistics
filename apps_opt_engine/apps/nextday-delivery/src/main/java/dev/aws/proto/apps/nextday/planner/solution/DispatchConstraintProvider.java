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

import static org.optaplanner.core.api.score.stream.ConstraintCollectors.sum;
import static org.optaplanner.core.api.score.stream.ConstraintCollectors.toList;

public class DispatchConstraintProvider implements ConstraintProvider {

    // Distance limit for one trip (50km)
    final int MAX_DISTANCE_AT_ONCE = 50 * 1000;

    // Visit limit for one trip
    final int MAX_NUM_OF_DESTINATIONS_AT_ONCE = 5;

    // Minimum load ratio for one vehicle
    final double MIN_LOAD_WEIGHT_RATIO = 0.7;

    @Override
    public Constraint[] defineConstraints(ConstraintFactory constraintFactory) {
        return new Constraint[]{
                vehicleCapacity(constraintFactory),
                vehicleCapacityLow(constraintFactory),

                distanceFromPreviousVisitOrVehicle(constraintFactory),
                distanceFromLastVisitToDepot(constraintFactory),
                distanceLimitByDelivery(constraintFactory),
                visitCountLimitByDelivery(constraintFactory),

                visitToSameCustomerLocation(constraintFactory),
                visitToSameCustomerLocationPreventSplit(constraintFactory),
                visitToSameCustomerAtOnce(constraintFactory),

                vehicleTimeGroup(constraintFactory),

                vehicleGrade(constraintFactory),
        };
    }

    // [HARD] Over-loaded, Max capacity by vehicles
    protected Constraint vehicleCapacity(ConstraintFactory factory) {
        return factory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getPlanningVehicle, sum(PlanningVisit::getDemands))
                .filter((vehicle, demand) -> demand > vehicle.getMaxCapacity().getWeight())
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_HARD,
                        (vehicle, demand) -> demand - vehicle.getMaxCapacity().getWeight())
                .asConstraint("vehicle capacity - HARD score");
    }

    // [MEDIUM] Too little load (70% below)
    protected Constraint vehicleCapacityLow(ConstraintFactory factory) {
        return factory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getPlanningVehicle, sum(PlanningVisit::getDemands))
                .filter((vehicle, totalLoads) -> totalLoads < vehicle.getMaxCapacity().getWeight() * MIN_LOAD_WEIGHT_RATIO)
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_MEDIUM,
                        (vehicle, totalLoads) -> (1 + (vehicle.getMaxCapacity().getWeight() - totalLoads) / 1000))
                .asConstraint("vehicle load low - MEDIUM score");
    }

    protected Constraint distanceFromPreviousVisitOrVehicle(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_SOFT,
                        PlanningVisit::scoreForDistanceFromPreviousVisitOrVehicle)
                .asConstraint("distance from previous visit - SOFT score");
    }

    protected Constraint distanceFromLastVisitToDepot(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .filter(PlanningVisit::isLastVisit)
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_SOFT,
                        PlanningVisit::scoreForDistanceFromLastVisitToHub)
                .asConstraint("distance from last visit to depot - SOFT score");
    }

    protected Constraint distanceLimitByDelivery(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getPlanningVehicleId, toList())
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_HARD,
                        (vehicleId, visitList) -> {
                            long dist = visitList.stream()
                                    .mapToLong(v -> {
                                        long partDist = v.getLocation().distanceTo(v.getPreviousVisitOrVehicle().getLocation()).getDistanceInMeters();
                                        if (v.isLastVisit()) partDist += v.getLocation().distanceTo(v.getPlanningVehicle().getLocation()).getDistanceInMeters();
                                        return partDist;
                                    })
                                    .sum();

                            if (dist > MAX_DISTANCE_AT_ONCE) {
                                return 1L + (dist - MAX_DISTANCE_AT_ONCE) / 10000;
                            } else {
                                return 0;
                            }
                        })
                .asConstraint("distance from distance limit - HARD score");
    }

    protected Constraint visitCountLimitByDelivery(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getPlanningVehicleId, toList())
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_MEDIUM,
                        (vehicleId, visitList) -> {
                            int locations = visitList.stream().map(PlanningVisit::getLocationId).collect(Collectors.toSet()).size();

                            if (locations > MAX_NUM_OF_DESTINATIONS_AT_ONCE) {
                                return (locations - MAX_NUM_OF_DESTINATIONS_AT_ONCE) * 100L;
                            } else {
                                return 0;
                            }
                        })
                .asConstraint("visit count limit at once - MEDIUM score");
    }

    protected Constraint visitToSameCustomerLocation(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getLocationId, toList())
                .filter((locId, visitList) -> visitList.size() >= 2)
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_MEDIUM,
                        (locId, visitList) -> (visitList.stream().map(PlanningVisit::getPlanningVehicleId).collect(Collectors.toSet()).size() - 1) * 1000L)
                .asConstraint("same customer - MEDIUM score");
    }

    protected Constraint visitToSameCustomerAtOnce(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getLocationId, PlanningVisit::getPlanningVehicleId, toList())
                .filter((locId, vehicleId, visitList) -> visitList.size() >= 2)
                .filter((locId, vehicleId, visitList) -> {
                            Set<String> previousVisitList = visitList.stream().map(PlanningVisit::getPreviousVisitOrVehicle).map(v -> {
                                if (v instanceof PlanningVisit) return ((PlanningVisit) v).getDeliveryCode();
                                else if (v instanceof PlanningVehicle) return ((PlanningVehicle) v).getWarehouseCode();
                                else throw new IllegalArgumentException(v.getClass() + " is not a VisitOrVehicle");
                            }).collect(Collectors.toSet());
                            previousVisitList.add(locId);

                            return previousVisitList.size() > 2;
                        }
                )
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_HARD,
                        (locId, vehicleId, visitList) -> (long) visitList.size())
                .asConstraint("same customer visit at once - HARD score");
    }

    protected Constraint visitToSameCustomerLocationPreventSplit(ConstraintFactory constraintFactory) {
        return constraintFactory
                .forEach(PlanningVisit.class)
                .groupBy(PlanningVisit::getLocationId, toList())
                .filter((locId, visitList) -> visitList.size() >= 2)
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_HARD,
                        (locId, visitList) -> {
                            List<PlanningVehicle> vehicles = visitList.stream().map(PlanningVisit::getPlanningVehicle).collect(Collectors.toList());

                            PlanningVehicle pv = vehicles.stream().max(Comparator.comparingInt(a -> a.getMaxCapacity().getWeight())).orElseThrow();

                            int maxCapacity = pv.getMaxCapacity().getWeight();
                            int numOfVehicles = new HashSet<>(vehicles).size();
                            int totalDemands = visitList.stream().mapToInt(PlanningVisit::getDemands).sum();

                            if (numOfVehicles >= 2 && totalDemands <= maxCapacity) return 1;
                            else return 0;
                        })
                .asConstraint("same customer - HARD score");
    }

    protected Constraint vehicleTimeGroup(ConstraintFactory factory) {
        return factory
                .forEach(PlanningVisit.class)
                .penalizeLong(
                        HardMediumSoftLongScore.ONE_HARD,
                        (visit) -> {
                            int visitTimeGroup = visit.getDeliveryTimeGroup();
                            int vehicleTimeGroup = visit.getPlanningVehicle().getTimeGroup();

                            if (visitTimeGroup < vehicleTimeGroup) return 1;
                            else return 0;
                        })
                .asConstraint("vehicleTimeGroup");
    }

    protected Constraint vehicleGrade(ConstraintFactory factory) {
        return factory
                .forEach(PlanningVehicle.class)
                .filter((order) -> !order.getPlanningVehicle().isCompanyOwnedVehicle())
                .join(PlanningVehicle.class, Joiners.equal(PlanningVehicle::getTimeGroup))
                .penalize(
                        HardMediumSoftLongScore.ONE_HARD,
                        (v1, v2) -> {
                            if (v1.getNextPlanningVisit() != null && v2.getPlanningVehicle().isCompanyOwnedVehicle() && v2.getNextPlanningVisit() == null)
                                return 1;
                            else
                                return 0;
                        })
                .asConstraint("company owned vehicle first");
    }
}
