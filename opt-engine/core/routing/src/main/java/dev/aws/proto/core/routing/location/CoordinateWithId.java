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
    public int hashCode() {
        return Objects.hashCode(this.id);
    }

    @Override
    public String toString() {
        return "[lat/lng = " + super.getLatitude() + "/" + super.getLongitude() + "][id = " + id + "]";
    }
}
