/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - @Path / @GET / @POST (JAX-RS) -> Spring MVC annotations.
 *   - @Inject field -> constructor injection.
 *   - The file is renamed from DispatchResource to DispatchController to match
 *     Spring conventions but the URL path (/opt-engine/*) and JSON shapes
 *     remain identical so external callers are unaffected.
 */
package dev.aws.proto.apps.nextday.api;

import dev.aws.proto.apps.appcore.api.response.RequestResult;
import dev.aws.proto.apps.nextday.api.request.DispatchRequest;
import dev.aws.proto.apps.nextday.api.response.SolverJobWithDeliveryJobs;
import dev.aws.proto.apps.nextday.config.DispatchOrderConfig;
import dev.aws.proto.apps.nextday.planner.solution.DispatchSolution;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping(
        path = "/opt-engine",
        produces = MediaType.APPLICATION_JSON_VALUE,
        consumes = MediaType.APPLICATION_JSON_VALUE
)
public class DispatchController {
    private static final Logger logger = LoggerFactory.getLogger(DispatchController.class);

    private final DispatchService dispatchService;

    public DispatchController(DispatchService dispatchService) {
        this.dispatchService = dispatchService;
    }

    interface DispatchSolutionListener {
        void onSolutionFounded(DispatchSolution solution);
    }

    @PostMapping(path = "/solve", consumes = MediaType.APPLICATION_JSON_VALUE)
    public RequestResult solve(@RequestBody DispatchRequest req) {
        logger.info("Dispatch solve request :: orders = {}", req.getOrders() == null ? 0 : req.getOrders().length);

        UUID problemId = UUID.randomUUID();

        try {
            dispatchService.saveInitialEnqueued(problemId, req);
        } catch (Exception e) {
            logger.error("There was an error saving the initial enqueued job into the database: {}", e.getMessage());
        }

        dispatchService.solveDispatchProblem(problemId, req);
        return RequestResult.of(problemId.toString());
    }

    @GetMapping(path = "/status/{problemId}", consumes = MediaType.ALL_VALUE)
    public SolverJobWithDeliveryJobs getSolutionStatus(@PathVariable("problemId") String id) {
        logger.debug(":: GetSolutionStatus :: problemId = {}", id);
        UUID problemId = UUID.fromString(id);

        return dispatchService.getSolutionStatus(problemId);
    }

    /**
     * Kicks off a solver job programmatically (used by {@link AppLifecycleMain} for
     * headless/batch execution).
     */
    public UUID solveDispatchJob(DispatchSolutionListener listener) {
        logger.info("Dispatch solve request ");

        UUID problemId = UUID.randomUUID();
        String warehouseCode = DispatchOrderConfig.getWarehouseCode();
        String orderDate = DispatchOrderConfig.getOrderDate();

        try {
            dispatchService.saveInitialEnqueued(problemId, null, warehouseCode, orderDate);
        } catch (Exception e) {
            logger.error("There was an error saving the initial enqueued job into the database: {}", e.getMessage());
        }

        if (listener != null) {
            dispatchService.setOnSolveJobFinishedListener(new DispatchService.SolveJobFinishedListener() {
                @Override
                public UUID getProblemId() {
                    return problemId;
                }

                @Override
                public void onSolveJobFinished(DispatchSolution solution) {
                    listener.onSolutionFounded(solution);
                }
            });
        }

        dispatchService.solveDispatchProblem(problemId, null);

        return problemId;
    }
}
