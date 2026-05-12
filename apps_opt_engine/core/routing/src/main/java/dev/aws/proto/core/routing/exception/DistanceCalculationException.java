/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.routing.exception;

import dev.aws.proto.core.exception.DispatcherException;

public class DistanceCalculationException extends DispatcherException {

    public DistanceCalculationException(String message, Throwable cause) {
        super(message, cause);
    }

    public DistanceCalculationException(String message) {
        super(message);
    }
}
