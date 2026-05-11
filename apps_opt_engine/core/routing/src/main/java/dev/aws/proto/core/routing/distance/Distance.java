/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.distance;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;

import java.util.Objects;

@JsonSerialize
public class Distance {

    /**
     * Zero distance, for example the distance from a location to itself.
     */
    public static final Distance ZERO = Distance.ofValue(0L, 0L);

    protected final long distanceInMeters;
    protected final long distanceInSeconds;

    protected Distance() {
        this.distanceInMeters = 0;
        this.distanceInSeconds = 0;
    }

    protected Distance(long distanceInMeters, long distanceInSeconds) {
        this.distanceInMeters = distanceInMeters;
        this.distanceInSeconds = distanceInSeconds;
    }

    /**
     * Create a distance of the given value.
     *
     * @param distanceInMeters  distance in meters
     * @param distanceInSeconds distance in seconds
     * @return distance
     */
    public static Distance ofValue(long distanceInMeters, long distanceInSeconds) {
        return new Distance(distanceInMeters, distanceInSeconds);
    }

    public long getDistanceInMeters() {
        return distanceInMeters;
    }

    public long getDistanceInSeconds() {
        return distanceInSeconds;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Distance distance)) return false;
        return distanceInMeters == distance.distanceInMeters && distanceInSeconds == distance.distanceInSeconds;
    }

    @Override
    public int hashCode() {
        return Objects.hash(distanceInMeters, distanceInSeconds);
    }

    @Override
    public String toString() {
        return String.format(
                "Distance = %dkm %dm | Time = %dh %dm %ds",
                distanceInMeters / 1000,
                distanceInMeters % 1000,
                distanceInSeconds / 3600_000,
                distanceInSeconds / 60_000 % 60,
                distanceInSeconds % 60);
    }
}
