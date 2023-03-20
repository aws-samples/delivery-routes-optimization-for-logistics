/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.exception;

public class CacheResolutionException extends RuntimeException {
    public CacheResolutionException(String message, Throwable cause) {
        super(message, cause);
    }

    public CacheResolutionException(String message) {
        super(message);
    }
}
