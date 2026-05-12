/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.api.response;

import lombok.Data;
import lombok.experimental.SuperBuilder;

import java.util.UUID;

/**
 * The base class for a dispatch request's response.
 */
@Data
@SuperBuilder
public class DispatchResult {
    /** The generated problemId that is used to lookup the solver job. */
    private UUID problemId;

    /** The timestamp of the dispatching request. */
    private long createdAt;

    /** The solver's final score. */
    private String score;

    /** The time (in milliseconds) it took to solve the dispatching problem. */
    @lombok.Builder.Default
    private long solverDurationInMs = -1L;

    /** The dispatching job's state. */
    private String state;
}
