/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.api.response;

import dev.aws.proto.apps.appcore.api.request.DispatchRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * Represents the immediate reponse of a {@link DispatchRequest}
 */
@Data
@RequiredArgsConstructor(staticName = "of")
public class RequestResult {
    /**
     * The generated ID for the solving job.
     */
    private final String problemId;

    /**
     * The optional error if any.
     */
    private String error;
}
