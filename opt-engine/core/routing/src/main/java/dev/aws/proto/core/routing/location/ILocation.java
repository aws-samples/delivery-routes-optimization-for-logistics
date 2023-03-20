/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.core.routing.location;

public interface ILocation {
    String id();
    Coordinate coordinate();
}
