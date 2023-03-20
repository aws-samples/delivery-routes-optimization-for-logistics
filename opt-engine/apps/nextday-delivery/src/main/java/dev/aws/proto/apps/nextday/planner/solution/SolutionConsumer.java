/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.planner.solution;

import dev.aws.proto.apps.appcore.api.response.DeliverySegment;
import dev.aws.proto.apps.appcore.api.response.Segment;
import dev.aws.proto.apps.nextday.domain.planning.VisitOrVehicle;
import dev.aws.proto.apps.nextday.location.Location;
import dev.aws.proto.apps.nextday.api.response.DeliveryJob;
import dev.aws.proto.apps.nextday.api.response.SolverJob;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.route.GraphhopperRouter;
import dev.aws.proto.core.routing.route.PolylineHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

public class SolutionConsumer {
    private static final Logger logger = LoggerFactory.getLogger(SolutionConsumer.class);

    public static SolverJob extractSolverJob(DispatchSolution solution, long solverDurationInMs) {

        return SolverJob.builder()
                .problemId(solution.getId())
                .warehouseCode(solution.getWarehouseCode())
                .warehouseName(solution.getWarehouseName())
                .orderDate(solution.getOrderDate())
                .orderCount(solution.getPlanningVisits().size())
                .createdAt(solution.getCreatedAt())
                .score(solution.getScore().toString())
                .solverDurationInMs(solverDurationInMs)
                .state("FINISHED")
                .executionId(solution.getExecutionId())
                .build();
    }

    public static List<DeliveryJob> extractDeliveryJobs(DispatchSolution solution, GraphhopperRouter router) {
        UUID solverJobId = solution.getId();
        List<DeliveryJob> deliveryJobs = new ArrayList<>();

        solution.getPlanningVehicles().forEach(planningVehicle -> {
            List<DeliverySegment> jobSegments = new ArrayList<>();

            PlanningVisit visit = planningVehicle.getNextPlanningVisit();
            if (visit == null) {
                // no visits assigned --> no deliveryJob created
                return;
            }

            Location prevLoc = planningVehicle.getLocation();
            int loadCapacity = 0;

            while (visit != null) {
                DeliverySegment.SegmentType segmentType;

                loadCapacity += visit.getDemands();

                if(visit.getNextPlanningVisit() == null) segmentType = DeliverySegment.SegmentType.TO_WAREHOUSE;
                else segmentType = DeliverySegment.SegmentType.TO_DESTINATION;

                Distance segmentDist = prevLoc.distanceTo(visit.getLocation());
                List<Coordinate> segmentPath = router.getPath(prevLoc.getCoordinate(), visit.getLocation().coordinate());
                String segmentPointsEnc = PolylineHelper.encodePointsToPolyline(segmentPath);

                DeliverySegment segment = DeliverySegment.builder()
                        .orderId(visit.getOrderId())
                        .index(visit.getVisitIndex())
                        .from(prevLoc.getCoordinate())
                        .to(visit.getLocation().getCoordinate())
                        .segmentType(segmentType)
                        .route(new Segment(segmentDist.getDistanceInMeters(), segmentDist.getDistanceInSeconds(), segmentPointsEnc))
                        .deliveryCode(visit.getDeliveryCode())
                        .deliveryName(visit.getDeliveryName())
                        .demands(String.valueOf(visit.getDemands()))
                        .deliveryTimeGroup(String.valueOf(visit.getDeliveryTimeGroup()))
                        .build();

                prevLoc = visit.getLocation();
                jobSegments.add(segment);
                visit = visit.getNextPlanningVisit();
            }

            DeliveryJob deliveryJob = DeliveryJob.builder()
                    .id(UUID.randomUUID())
                    .createdAt(Timestamp.valueOf(LocalDateTime.now()).getTime())
                    .solverJobId(solverJobId)
                    .vehicleId(planningVehicle.getId())
                    .carNo(planningVehicle.getCarNo())
                    .deliveryTimeGroup(String.valueOf(planningVehicle.getTimeGroup()))
                    .loadCapacity(String.valueOf(loadCapacity))
                    .maxCapacity(String.valueOf(planningVehicle.getMaxCapacity().getWeight()))
                    .segments(jobSegments)
                    .route(Segment.fromSegments(jobSegments))
                    .build();
            deliveryJobs.add(deliveryJob);
        });

        return deliveryJobs;
    }

    public static void logSolution(DispatchSolution solution) {
        logger.info("[{}] solution score: {}", solution.getId(), solution.getScore());

        AtomicInteger notAssignedVehicleCnt = new AtomicInteger(0);
        AtomicInteger totalVisits = new AtomicInteger(0);

        solution.getPlanningVehicles().forEach(vehicle -> {
            if (vehicle.getNextPlanningVisit() == null) {
                notAssignedVehicleCnt.incrementAndGet();
                return;
            }

            logger.info("vehicle[{}] :: [visits = {}] :: location {}", vehicle.getId(), vehicle.chainLength(), vehicle.getLocation().getCoordinate());
            totalVisits.addAndGet((int)vehicle.chainLength());

            List<Coordinate> points = new ArrayList<>();
            points.add(vehicle.getLocation().getCoordinate());

            int totalLoads = 0;
            int totalDistance = 0;
            VisitOrVehicle currVisit = vehicle;
            PlanningVisit nextVisit = vehicle.getNextPlanningVisit();
            while (nextVisit != null) {
                logger.info("\t{}", nextVisit);

                totalLoads += nextVisit.getDemands();
                totalDistance += currVisit.getLocation().distanceTo(nextVisit.getLocation()).getDistanceInMeters();
                points.add(nextVisit.getLocation().getCoordinate());

                currVisit = nextVisit;
                nextVisit = nextVisit.getNextPlanningVisit();
            }

            String loadRatio = String.format("%.2f", 100 * (float)totalLoads / (float)vehicle.getMaxCapacity().getWeight());
            logger.info("\tTotal loads : {}% [ {} / {} ]\tTotal distance : {}m", loadRatio, totalLoads, vehicle.getMaxCapacity().getWeight(), totalDistance);

            String coordsStr = points.stream().map(c -> String.format("[%f, %f]", c.getLongitude(), c.getLatitude())).collect(Collectors.joining(","));

            logger.info("\tPoints: {}", coordsStr);
        });

        logger.info("Visit total: {}", totalVisits.get());
        logger.info("Number of vehicles not assigned: {}", notAssignedVehicleCnt.get());

        solution.getPlanningVisits().forEach(visit -> {
            if(visit.getPlanningVehicle() == null || visit.getPlanningVehicleId() == null) {
                logger.warn("NOT ASSIGNED VISIT :: {}", visit);
            }
        });
    }
}
