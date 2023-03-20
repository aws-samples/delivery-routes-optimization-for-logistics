/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.cache.persistence;

public interface ICachePersistence<TDistanceCache> {
    void buildCache(TDistanceCache distanceCache);

    TDistanceCache importCache();
}
