/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.location;

import lombok.Data;

import java.util.Objects;

@Data
public class CoordinateWithId extends Coordinate {
    private String id;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CoordinateWithId that = (CoordinateWithId) o;
        return Objects.equals(this.id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(this.id);
    }

    @Override
    public String toString() {
        return "[lat/lng = " + super.getLatitude() + "/" + super.getLongitude() + "][id = " + id + "]";
    }
}
