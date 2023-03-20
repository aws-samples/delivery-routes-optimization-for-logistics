/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.planner.solution;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import org.optaplanner.core.api.score.AbstractScore;

import java.util.UUID;

/**
 * Base class that represents a dispatching solution.
 * Extend this class while implementing your own model for your own domain.
 *
 * @param <TScore> The score type for the solution. {@see https://docs.optaplanner.org/8.17.0.Final/optaplanner-docs/html_single/index.html#scoreCalculation}
 */
@Data
@NoArgsConstructor
@SuperBuilder
public abstract class DispatchSolutionBase<TScore extends AbstractScore> {
    /**
     * The unique identifier for the solution.
     */
    @JsonProperty("dispatchingSolutionId")
    protected UUID id;

    /**
     * The name of the dispatching solution.
     */
    protected String name;

    /**
     * Timestamp of the creation of this solution.
     */
    protected long createdAt;

    /**
     * Step function execution ID.
     */
    protected String executionId;

    /**
     * Solver score for the solution.
     */
    protected TScore score;
}
