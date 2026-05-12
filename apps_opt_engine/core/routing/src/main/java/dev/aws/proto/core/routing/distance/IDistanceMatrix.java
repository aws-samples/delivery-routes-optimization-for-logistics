/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.distance;

import dev.aws.proto.core.routing.location.ILocation;

public interface IDistanceMatrix<TDistance extends Distance> {
    TDistance distanceBetween(ILocation origin, ILocation destination);

    TDistance distanceBetween(String originID, String destinationID);
}
