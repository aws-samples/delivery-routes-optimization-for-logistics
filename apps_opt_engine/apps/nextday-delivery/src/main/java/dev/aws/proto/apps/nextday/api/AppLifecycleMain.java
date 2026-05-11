/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 *
 * Spring Boot migration notes:
 *   - @ApplicationScoped -> @Component.
 *   - @Observes StartupEvent -> @EventListener(ApplicationReadyEvent.class).
 *   - @Observes ShutdownEvent -> @EventListener(ContextClosedEvent.class).
 *   - The headless batch-solver behavior is retained: on startup we kick off a
 *     solver job and shut down the JVM once it finishes (used by the ECS/Batch
 *     deployment scenario).
 */
package dev.aws.proto.apps.nextday.api;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.ContextClosedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Component
public class AppLifecycleMain {

    private static final Logger LOGGER = LoggerFactory.getLogger("AppLifecycleMain");

    // Time delays for bootstrapping and terminating application
    private static final int APP_WAIT_SECONDS = 5;

    private final DispatchController controller;
    private final boolean autoSolveOnStartup;

    public AppLifecycleMain(DispatchController controller,
                            @Value("${app.dispatch.auto-solve-on-startup:true}") boolean autoSolveOnStartup) {
        this.controller = controller;
        this.autoSolveOnStartup = autoSolveOnStartup;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onStart() {
        LOGGER.info("NextDay Delivery Optimization -->> application is starting...");
        LOGGER.debug("NextDay Delivery Optimization -->> {}", LocalDateTime.now());

        if (!autoSolveOnStartup) {
            LOGGER.info("Auto solve-on-startup is disabled; skipping solver kickoff.");
            return;
        }

        final DispatchController.DispatchSolutionListener listener = createDispatchFinishedListener();

        Thread solverJob = createSolverJob(listener);
        solverJob.start();
    }

    @EventListener(ContextClosedEvent.class)
    public void onStop() {
        LOGGER.info("NextDay Delivery Optimization -->> application is stopping...");
    }

    private Thread createSolverJob(DispatchController.DispatchSolutionListener listener) {
        return new Thread(() -> {
            for (int count = APP_WAIT_SECONDS; count > 0; count--) {
                try {
                    TimeUnit.SECONDS.sleep(1);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(e);
                }
            }
            UUID problemId = controller.solveDispatchJob(listener);
            LOGGER.info(">>>> Solver job started - {}", problemId);
        });
    }

    private DispatchController.DispatchSolutionListener createDispatchFinishedListener() {
        return solution -> {
            LOGGER.info(">>>> Solver job finished - {}", (solution != null ? solution.getId() : "solution not found"));

            new Thread(() -> {
                try {
                    for (int count = APP_WAIT_SECONDS; count > 0; count--) {
                        LOGGER.info("Shutdown service for {} seconds...", count);
                        TimeUnit.SECONDS.sleep(1);
                    }
                    System.exit(0);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException(e);
                }
            }).start();
        };
    }
}
