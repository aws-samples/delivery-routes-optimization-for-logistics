/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Getter
    private String Id;

    @Getter
    private String warehouseCode;

    @Getter
    private String deliveryCode;

    @Getter
    private String deliveryName;

    @Getter
    private String address;

    @Getter
    private int deliveryTimeGroup;

    @Getter
    private double latitude;

    @Getter
    private double longitude;
}
