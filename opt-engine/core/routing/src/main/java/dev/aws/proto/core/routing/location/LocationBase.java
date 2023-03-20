/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.location;

import dev.aws.proto.core.routing.distance.Distance;
import dev.aws.proto.core.routing.distance.IDistanceMatrix;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Objects;

@Data
@NoArgsConstructor
public class LocationBase<TDistance extends Distance> implements ILocation, Comparable<LocationBase<TDistance>> {
    private String id;
    private Coordinate coordinate;
    private LocationType locationType;
    private IDistanceMatrix<TDistance> distanceMatrix;

    protected LocationBase(String id, Coordinate coordinate, LocationType locationType) {
        this.id = id;
        this.coordinate = coordinate;
        this.locationType = locationType;
    }

    public TDistance distanceTo(ILocation other) {
        return this.distanceMatrix.distanceBetween(this.id(), other.id());
    }

    @Override
    public String id() {
        return id;
    }

    @Override
    public Coordinate coordinate() {
        return this.coordinate;
    }

    @Override
    public int compareTo(LocationBase other) {
        return this.locationType.compareTo(other.locationType);
    }

    @Override
    public String toString() {
        return "[" + locationType + "][" + id + "]" + ((Coordinate) coordinate).toString();
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, coordinate, locationType);
    }
}
