/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.route;

import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.location.LocationBase;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Arrays;
import java.util.Objects;

/**
 * Represents a segment route with distance information and an encoded polyline
 * string representation for the routing points on the map.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SegmentRoute extends Distance {
    private String pointsEncoded;

    public SegmentRoute(Distance dist, String pointsEncoded) {
        super(dist.getDistanceInMeters(), dist.getDistanceInSeconds());
        this.pointsEncoded = pointsEncoded;
    }

    public static SegmentRoute between(LocationBase<Distance> origin, LocationBase<Distance> destination) {
        Distance dist = origin.distanceTo(destination);
        String pointsEncoded = PolylineHelper.encodePointsToPolyline(Arrays.asList(origin.getCoordinate(), destination.getCoordinate()));

        return new SegmentRoute(dist, pointsEncoded);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        SegmentRoute that = (SegmentRoute) o;
        return Objects.equals(pointsEncoded, that.pointsEncoded)
                && getDistanceInMeters() == that.getDistanceInMeters()
                && getDistanceInSeconds() == that.getDistanceInSeconds();
    }

    @Override
    public int hashCode() {
        return Objects.hash(pointsEncoded, super.getDistanceInMeters(), super.getDistanceInSeconds());
    }
}
