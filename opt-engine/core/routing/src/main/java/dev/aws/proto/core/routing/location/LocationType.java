/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.routing.location;

import java.io.IOException;
import java.io.ObjectInputStream;
import java.util.Arrays;
import java.util.Optional;

public enum LocationType implements Comparable<LocationType> {
    /**
     * Destination location. E.g.: customer
     */
    DESTINATION(1),

    /**
     * Origin location. E.g.: restaurant, supplier, seller
     */
    ORIGIN(2),

    /**
     * Moving location. E.g.: moving driver receiving an instant delivery order
     */
    MOVING_LOCATION(4),

    /**
     * Hub location. E.g.: where vehicles are "stored"
     */
    HUB(8),

    /**
     * Warehouse location. (This represents interim warehouse while delivering with multiple hops)
     */
    WAREHOUSE(16);

    private final int value;

    private LocationType(int value) {
        this.value = value;
    }

    static LocationType of(ObjectInputStream inputStream) throws IOException {
        int value = inputStream.readInt();
        Optional<LocationType> locationType = Arrays.stream(LocationType.values())
                .filter(lt -> lt.value == value)
                .findFirst();

        return locationType.get();
    }

    public int value() {
        return value;
    }
}
