/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.api;

import dev.aws.proto.apps.appcore.api.response.RequestResult;
import dev.aws.proto.apps.nextday.api.request.DispatchRequest;
import dev.aws.proto.apps.nextday.api.response.SolverJobWithDeliveryJobs;
import dev.aws.proto.apps.nextday.config.DispatchOrderConfig;
import dev.aws.proto.apps.nextday.planner.solution.DispatchSolution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.UUID;

@ApplicationScoped
@Path("/opt-engine")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class DispatchResource {
    private static final Logger logger = LoggerFactory.getLogger(DispatchResource.class);

    @Inject
    DispatchService dispatchService;

    interface DispatchSolutionListener{
        void onSolutionFounded(DispatchSolution solution);
    }

    @POST
    @Path("solve")
    public RequestResult solve(DispatchRequest req) {
        logger.info("Dispatch solve request :: orders = {}", req.getOrders().length);

        UUID problemId = UUID.randomUUID();

        try {
            dispatchService.saveInitialEnqueued(problemId, req);
        } catch (Exception e) {
            logger.error("There was an error saving the initial enqueued job into the database: {}", e.getMessage());
        }

        dispatchService.solveDispatchProblem(problemId, req);
        return RequestResult.of(problemId.toString());
    }

    @GET
    @Path("status/{problemId}")
    public SolverJobWithDeliveryJobs getSolutionStatus(@PathParam("problemId") String id) {
        logger.debug(":: GetSolutionStatus :: problemId = {}", id);
        UUID problemId = UUID.fromString(id);

        return dispatchService.getSolutionStatus(problemId);
    }

    public UUID solveDispatchJob( DispatchSolutionListener listener){
        logger.info("Dispatch solve request ");

        UUID problemId = UUID.randomUUID();
        String warehouseCode = DispatchOrderConfig.getWarehouseCode();
        String orderDate = DispatchOrderConfig.getOrderDate();

        try {
            dispatchService.saveInitialEnqueued(problemId, null, warehouseCode, orderDate);
        } catch (Exception e) {
            logger.error("There was an error saving the initial enqueued job into the database: {}", e.getMessage());
        }

        // Event listeners for solver job finished
        if(listener != null) {
            dispatchService.setOnSolveJobFinishedListener(new DispatchService.SolveJobFinishedListener() {
                @Override
                public UUID getProblemId() { return problemId;}
                @Override
                public void onSolveJobFinished(DispatchSolution solution) { listener.onSolutionFounded(solution); }
            });
        }

        // Start to find solution
        dispatchService.solveDispatchProblem(problemId, null);

        return problemId;
    }
}
