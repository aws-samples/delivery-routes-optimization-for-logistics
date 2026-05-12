/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.Objects;

@Data
@AllArgsConstructor
public class Order {

    private String orderNo;
    private String orderDate;
    private String deliveryCode;
    private double sumWeight;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Order that = (Order) o;
        return Objects.equals(this.orderNo, that.orderNo);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(this.orderNo);
    }
}
