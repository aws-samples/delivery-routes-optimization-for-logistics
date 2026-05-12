/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.appcore.api.request;

import dev.aws.proto.core.Order;
import lombok.Data;

/**
 * Base class for a dispatch request.
 * Extend this class while implementing your own domain.
 *
 * @param <TOrder> The concrete type of the Order in the domain.
 */
@Data
public class DispatchRequest<TOrder extends Order> {
    /**
     * The step function execution ID.
     */
    private String executionId;

    /**
     * List of orders to dispatch.
     */
    private TOrder[] orders;
}
