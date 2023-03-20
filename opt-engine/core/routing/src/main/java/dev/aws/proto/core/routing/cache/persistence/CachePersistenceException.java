/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.cache.persistence;

import dev.aws.proto.core.exception.DispatcherException;

public class CachePersistenceException extends DispatcherException {
    public CachePersistenceException(String message, Throwable cause) {
        super(message, cause);
    }

    public CachePersistenceException(String message) {
        super(message);
    }
}
