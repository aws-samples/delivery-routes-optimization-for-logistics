/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.api;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;

import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import org.jboss.logging.Logger;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class AppLifecycleMain {

    // Time delays for bootstrapping and terminating application
    private static final int APP_WAIT_SECONDS = 5;

    @Inject
    DispatchResource resource;

    private static final Logger LOGGER = Logger.getLogger("AppLifecycleMain");

    void onStart(@Observes StartupEvent ev) {
        LOGGER.info("NextDay Delivery Optimization -->> application is starting...");
        LOGGER.debug("NextDay Delivery Optimization -->> "+ LocalDateTime.now());

        // Add event listener : if solver job is finished,terminate this application in 5 seconds
        final DispatchResource.DispatchSolutionListener listener = createDispatchFinishedListener();

        // Start to find solution
        Thread solverJob = createSolverJob(listener);
        solverJob.start();
    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("NextDay Delivery Optimization -->> application is stopping...");
    }

    private Thread createSolverJob( DispatchResource.DispatchSolutionListener listener){
        return new Thread(()->{
            for(int count = APP_WAIT_SECONDS ; count > 0 ; count--){
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
            UUID problemId = resource.solveDispatchJob(listener);
            LOGGER.info(">>>> Solver job started - "+problemId.toString());
        });
    }

    private DispatchResource.DispatchSolutionListener createDispatchFinishedListener() {
        return solution -> {
            // Solver job finished
            LOGGER.info(">>>> Solver job finished - "+(solution != null ? solution.getId() : "solution not found"));

            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        for(int count = APP_WAIT_SECONDS ; count > 0 ; count--){
                            LOGGER.info("Shutdown service for " + count + " seconds...");
                            TimeUnit.SECONDS.sleep(1);
                        }
                        System.exit(0);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
            }).start();
        };
    }
}
