/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.appcore.planner.solution;

import org.optaplanner.core.api.solver.SolverJob;

/**
 * The state of the Optaplanner solution.
 *
 * @param <TSolution>  The type of the solution.
 * @param <TProblemId> The type of the problem ID.
 */
public class SolutionState<TSolution, TProblemId> {
    /**
     * The Optaplanner solver job.
     */
    public SolverJob<TSolution, TProblemId> solverJob;

    /**
     * The problem ID.
     */
    public TSolution problem;

    /**
     * Timestamp to indicate when the problem is starting to be solved.
     */
    public long startTimestamp;

    public SolutionState(SolverJob<TSolution, TProblemId> solverJob, TSolution problem, long startTimestamp) {
        this.solverJob = solverJob;
        this.problem = problem;
        this.startTimestamp = startTimestamp;
    }
}
