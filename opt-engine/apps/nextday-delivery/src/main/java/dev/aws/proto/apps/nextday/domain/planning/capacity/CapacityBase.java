/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning.capacity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CapacityBase {
    private int length;
    private int height;
    private int width;
    private int weight;

    @Override
    public String toString() {
        return "[l=" + length + " | h=" + height + " | w=" + weight + "][weight = " + weight + "]";
    }
}
