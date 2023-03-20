/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.api;

import dev.aws.proto.apps.appcore.config.SolutionConfig;
import dev.aws.proto.apps.appcore.planner.solution.SolutionState;
import dev.aws.proto.apps.nextday.config.DispatchOrderConfig;
import dev.aws.proto.apps.nextday.domain.planning.*;
import dev.aws.proto.apps.nextday.domain.planning.builder.PlanningVehicleListBuilder;
import dev.aws.proto.apps.nextday.domain.planning.builder.PlanningVisitListBuilder;
import dev.aws.proto.core.Order;
import dev.aws.proto.apps.nextday.api.request.DispatchRequest;
import dev.aws.proto.apps.nextday.api.response.SolverJob;
import dev.aws.proto.apps.nextday.data.*;
import dev.aws.proto.apps.nextday.location.HubLocation;
import dev.aws.proto.apps.nextday.location.Location;
import dev.aws.proto.apps.nextday.planner.solution.DispatchSolution;
import dev.aws.proto.apps.nextday.planner.solution.SolutionConsumer;
import dev.aws.proto.apps.nextday.api.response.DeliveryJob;
import dev.aws.proto.apps.nextday.api.response.SolverJobWithDeliveryJobs;
import dev.aws.proto.apps.nextday.config.DistanceCachingConfig;
import dev.aws.proto.core.routing.cache.persistence.ICachePersistence;
import dev.aws.proto.core.routing.config.RoutingConfig;
import dev.aws.proto.core.routing.distance.DistanceMatrix;
import dev.aws.proto.core.routing.route.GraphhopperRouter;
import org.optaplanner.core.api.score.buildin.hardmediumsoftlong.HardMediumSoftLongScore;
import org.optaplanner.core.api.solver.SolverManager;
import org.optaplanner.core.config.solver.SolverConfig;
import org.optaplanner.core.config.solver.SolverManagerConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * The concrete implementation of the dispatch service for the sameday-directpudo delivery domain.
 */
@ApplicationScoped
public class DispatchService extends dev.aws.proto.apps.appcore.api.DispatchService<Order, DispatchRequest, DispatchSolution> {
    private static final Logger logger = LoggerFactory.getLogger(DispatchService.class);

    @Inject
    DdbDeliveryJobService deliveryJobService;

    @Inject
    DdbSolverJobService solverJobService;

    @Inject
    DdbHubService hubService;

    @Inject
    DdbVehicleService vehicleService;

    @Inject
    DistanceCachingConfig distanceCachingConfig;

    @Inject
    DdbOrderService orderService;

    @Inject
    DdbCustomerLocationService customerLocationService;


    private DistanceMatrix latlongDistanceCache;


    public interface SolveJobFinishedListener {
        UUID getProblemId();
        void onSolveJobFinished(DispatchSolution solution);
    }

    private Set<SolveJobFinishedListener> solveJobFinishedListeners = new HashSet<>();
    public void setOnSolveJobFinishedListener(SolveJobFinishedListener listener) {
        this.solveJobFinishedListeners.add(listener);
    }
    public void removeOnSolveJobFinishedListener(SolveJobFinishedListener listener) {
        this.solveJobFinishedListeners.remove(listener);
    }

    DispatchService(RoutingConfig routingConfig, SolutionConfig solutionConfig, DistanceCachingConfig distanceCachingConfig) {
        this.routingConfig = routingConfig;
        this.solutionConfig = solutionConfig;
        this.distanceCachingConfig = distanceCachingConfig;

        // instantiate the graphhopper router
        this.graphhopperRouter = new GraphhopperRouter(routingConfig.graphHopper(), routingConfig.routingProfile());

        // instantiate distance cache
        try {
            ICachePersistence<DistanceMatrix> distanceMatrixPersistence = distanceCachingConfig.getCachePersistence();
            this.latlongDistanceCache = distanceMatrixPersistence.importCache();
        } catch(Exception ex) {
            //logger.error(ex.getMessage());
        }

        // create the solver config and the solver manager
        SolverConfig solverConfig = SolverConfig.createFromXmlFile(java.nio.file.Path.of(this.solutionConfig.getSolverConfigXmlPath()).toFile());
        this.solverManager = SolverManager.create(solverConfig, new SolverManagerConfig());
        this.solutionMap = new ConcurrentHashMap<>();
    }

    /**
     * @param problemId The generated ID for the problem.
     * @param req       The dispatch request object.
     */
    @Override
    public void solveDispatchProblem(UUID problemId, DispatchRequest req) {
        long createdAt = Timestamp.valueOf(LocalDateTime.now()).getTime();
        String executionId = (req == null)?"TEMP_ID":req.getExecutionId(); // http 요청이 아닌경우 executionId 가 없어서 임시값 부여
        logger.info("SolveDispatchProblem request :: problemId={} :: executionId={}", problemId, executionId);

        final String DISPATCH_WAREHOUSE_CODE = DispatchOrderConfig.getWarehouseCode();
        final String DISPATCH_ORDER_DATE = DispatchOrderConfig.getOrderDate();
        final int NUM_CONTRACTED_VEHICLES = DispatchOrderConfig.getMaxContractedVehicles();
        final int MAX_TIME_GROUP = DispatchOrderConfig.getMaxTimeGroups();

        logger.debug("Pulling order information");
        List<VisitOrder> orders = orderService.listOrders(DISPATCH_WAREHOUSE_CODE, DISPATCH_ORDER_DATE);
        if(orders == null || orders.size() == 0) {
            logger.error("No order exists - WarehouseCode : [{}] , OrderDate : [{}]", DISPATCH_WAREHOUSE_CODE, DISPATCH_ORDER_DATE);
            // Save solution abort reason
            saveStopSolverByNoOrders(problemId, req, DISPATCH_WAREHOUSE_CODE, DISPATCH_ORDER_DATE);
            // finish solution job
            notifySolverJobFinished(problemId, null);
            return;
        }

        logger.debug("Pulling hubs information");
        List<PlanningHub> hubs = hubService.listHubs();
        HubLocation hubLocation = new HubLocation(hubs.get(0).getId(), hubs.get(0).getCoordinate());

        logger.debug("Pulling vehicle information");
        List<PlanningVehicle> vehicleBase = vehicleService.listPlanningVehicle();
        List<PlanningVehicle> vehicles = PlanningVehicleListBuilder.builder(vehicleBase)
                        .setContractedVehicles(NUM_CONTRACTED_VEHICLES)
                        .setHubLocation(hubLocation)
                        .setMaxTimeGroup(MAX_TIME_GROUP)
                        .build();

        /*--------------------------------------------------------------------------------------------------*/
        logger.debug("Pulling location information");
        Map<String, Location> locationMap = customerLocationService.toLocations(this.latlongDistanceCache.getLocationKeyMap());
        List<Location> locationList = locationMap.values().stream().collect(Collectors.toList());
        locationList.add(hubLocation);

        // save the reference to the distance matrix for each location for convenience
        for (Location loc : locationList) {
            loc.setDistanceMatrix(this.latlongDistanceCache);
        }

        logger.debug("Pulling visit information");
        Map<String, Customer> customers = customerLocationService.dictCustomers();
        List<PlanningVisit> planningVisits = PlanningVisitListBuilder.builder(orders, customers, locationMap).build();

        // create the problem instance
        DispatchSolution realProblem = DispatchSolution.builder()
                .id(problemId)
                .name("NextDayDeliveryDispatch")
                .warehouseCode(hubs.get(0).getId())
                .warehouseName(hubs.get(0).getName())
                .orderDate(DISPATCH_ORDER_DATE)
                .createdAt(createdAt)
                .executionId(executionId)
                .score(HardMediumSoftLongScore.ZERO)
                .locations(locationList)
                .planningVisits(planningVisits)
                .planningVehicles(vehicles)
                .hubs(hubs)
                .build();

        logger.info("---------------------------------------------------------------");
        logger.info(" [ Solution Summary ]");
        logger.info("---------------------------------------------------------------");
        logger.info(" Problem ID : "+problemId);
        logger.info(" Warehouse Code : "+DISPATCH_WAREHOUSE_CODE);
        logger.info(" Order Date : "+DISPATCH_ORDER_DATE);
        logger.info(" Created At : "+createdAt);
        logger.info("---------------------------------------------------------------");
        logger.info(" Locations : "+locationList.size());
        logger.info(" Visits : "+planningVisits.size());
        logger.info(" Vehicles : "+vehicles.size());
        logger.info(" Hubs : "+hubs);
        logger.info("---------------------------------------------------------------");

        // optaplanner FTW
        org.optaplanner.core.api.solver.SolverJob<DispatchSolution, UUID> optaSolverJob = this.solverManager.solve(problemId, super::problemFinder, this::finalBestSolutionConsumer);
        // save the state
        this.solutionMap.put(problemId, new SolutionState<>(optaSolverJob, realProblem, System.currentTimeMillis()));
        saveSolverJobStarted(problemId, null, hubs.get(0).getId(), hubs.get(0).getName(), DISPATCH_ORDER_DATE, planningVisits.size());
    }

    @Override
    protected void finalBestSolutionConsumerHook(DispatchSolution dispatchSolution, long solverDurationInMs) {
        SolutionConsumer.logSolution(dispatchSolution);

        // Save optimal solution
        try {
            List<DeliveryJob> deliveryJobs = SolutionConsumer.extractDeliveryJobs(dispatchSolution, graphhopperRouter);
            deliveryJobService.saveJobsForSolverJobId(dispatchSolution.getId(), deliveryJobs);
        } catch (Exception e) {
            logger.error("Saving deliveryJobs for solverJobId {} failed: {}", dispatchSolution.getId(), e.getMessage());
            e.printStackTrace();
        }

        // Save SolverJob status
        try {
            SolverJob solverJob = SolutionConsumer.extractSolverJob(dispatchSolution, solverDurationInMs);
            solverJobService.save(solverJob);
        } catch (Exception e) {
            logger.error("Saving solverJob failed: {}", e.getMessage());
            e.printStackTrace();
        }

        logger.info(
                "[{}ms] :: finalBestSolutionConsumerHook :: planningVehicles = {} :: planningVisits = {} :: hubs = {} :: locations = {}",
                solverDurationInMs,
                dispatchSolution.getPlanningVehicles().size(),
                dispatchSolution.getPlanningVisits().size(),
                dispatchSolution.getHubs().size(),
                dispatchSolution.getLocations().size()
        );

        notifySolverJobFinished(dispatchSolution.getId(), dispatchSolution);
    }

    private void notifySolverJobFinished(UUID problemId, DispatchSolution dispatchSolution){
        // Notifications for finished optimization job
        for(SolveJobFinishedListener listener : solveJobFinishedListeners) {
            if(listener.getProblemId().equals(problemId)){
                listener.onSolveJobFinished(dispatchSolution);
            }
        }
    }

    public SolverJobWithDeliveryJobs getSolutionStatus(UUID problemId) {
        logger.debug("Getting solution status for id {}", problemId);

        SolverJob solverJob = solverJobService.getItem(problemId);
        if (solverJob == null) {
            logger.debug("No solverJob found with ID {}", problemId);
            return null;
        }

        List<DeliveryJob> deliveryJobs = deliveryJobService.retrieveDeliveryJobsForSolverJobId(problemId);

        SolverJobWithDeliveryJobs result = SolverJobWithDeliveryJobs.builder()
                .problemId(solverJob.getProblemId())
                .createdAt(solverJob.getCreatedAt())
                .score(solverJob.getScore())
                .solverDurationInMs(solverJob.getSolverDurationInMs())
                .state(solverJob.getState())
                .executionId(solverJob.getExecutionId())
                .deliveryJobs(deliveryJobs)
                .build();

        return result;
    }

    public void saveInitialEnqueued(UUID problemId, DispatchRequest req) {
        solverJobService.save(SolverJob.builder()
                .problemId(problemId)
                .createdAt(Timestamp.valueOf(LocalDateTime.now()).getTime())
                .state("ENQUEUED")
                .score("NA")
                .build());
    }

    public void saveInitialEnqueued(UUID problemId, DispatchRequest req, String warehouseCode, String orderDate) {
        solverJobService.save(SolverJob.builder()
                .problemId(problemId)
                .warehouseCode(warehouseCode)
                .orderDate(orderDate)
                .executionId(req==null?"NO_EXEC_ID":req.getExecutionId())
                .createdAt(Timestamp.valueOf(LocalDateTime.now()).getTime())
                .state("ENQUEUED")
                .score("NA")
                .build());
    }

    public void saveStopSolverByNoOrders(UUID problemId, DispatchRequest req, String warehouseCode, String orderDate) {
        solverJobService.save(SolverJob.builder()
                .problemId(problemId)
                .warehouseCode(warehouseCode)
                .orderDate(orderDate)
                .executionId(req==null?"NO_EXEC_ID":req.getExecutionId())
                .createdAt(Timestamp.valueOf(LocalDateTime.now()).getTime())
                .state("QUIT_NO_ORDER")
                .score("NA")
                .build());
    }

    public void saveSolverJobStarted(UUID problemId, DispatchRequest req, String warehouseCode, String orderDate, String warehouseName, int orderCount) {
        solverJobService.save(SolverJob.builder()
                .problemId(problemId)
                .warehouseCode(warehouseCode)
                .warehouseName(warehouseName)
                .orderDate(orderDate)
                .orderCount(orderCount)
                .executionId(req==null?"NO_EXEC_ID":req.getExecutionId())
                .createdAt(Timestamp.valueOf(LocalDateTime.now()).getTime())
                .state("STARTED")
                .score("NA")
                .build());
    }
}
