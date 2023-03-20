/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.routing.distance;

import dev.aws.proto.core.routing.exception.DistanceCalculationException;
import dev.aws.proto.core.routing.location.Coordinate;

import java.util.function.Function;

public interface IDistanceCalculator {

    static <TRouterResponse, TResult>
    TResult travelDistanceSelector(
            TRouterResponse response, Function<TRouterResponse, TResult> selector) {
        return selector.apply(response);
    }

    /**
     * Calculate travel distance.
     *
     * @param origin      origin
     * @param destination destination
     * @return travel distance
     * @throws DistanceCalculationException when the distance between given coordinates cannot be calculated
     */
    Distance travelDistance(Coordinate origin, Coordinate destination);


}
