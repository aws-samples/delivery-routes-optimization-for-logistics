/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.appcore.planner.solution;

import java.util.HashMap;
import java.util.Map;

/**
 * Status of the Optaplanner solution.
 */
public enum SolutionStatus {
    INITIALIZED(0),
    SOLVING(1),
    TERMINATED(2);

    private static Map<Integer, SolutionStatus> inverseMap = new HashMap<>();

    static {
        inverseMap.put(0, SolutionStatus.INITIALIZED);
        inverseMap.put(1, SolutionStatus.SOLVING);
        inverseMap.put(2, SolutionStatus.TERMINATED);
    }

    private int value;

    SolutionStatus(int i) {
        this.value = i;
    }

    public static SolutionStatus of(int value) {
        return inverseMap.get(value);
    }

    public int intValue() {
        return value;
    }
}
