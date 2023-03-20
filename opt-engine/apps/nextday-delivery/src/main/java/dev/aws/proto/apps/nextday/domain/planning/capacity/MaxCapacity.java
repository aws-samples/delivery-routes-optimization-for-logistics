/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning.capacity;

import lombok.experimental.SuperBuilder;

@SuperBuilder
public class MaxCapacity extends CapacityBase {
    public boolean exceeds(float length, float height, float width, float weight) {
        return
                length > this.getLength()
                        || height > this.getHeight()
                        || width > this.getWidth()
                        || weight > this.getWeight();
    }

    @Override
    public String toString() {
        return "[max capacity: " + super.toString() + "]";
    }
}
