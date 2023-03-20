/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.data;

import dev.aws.proto.apps.appcore.data.DdbServiceBase;
import dev.aws.proto.apps.nextday.config.DdbProperties;
import dev.aws.proto.apps.nextday.domain.planning.PlanningHub;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.apps.nextday.domain.planning.VisitOrder;
import dev.aws.proto.core.Order;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.util.aws.SsmUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DdbOrderService extends DdbServiceBase {
    private static final Logger logger = LoggerFactory.getLogger(DdbOrderService.class);

    @Inject
    DdbProperties ddbProperties;

    private final String tableName;

    DdbOrderService(DdbProperties ddbProperties) {
        this.ddbProperties = ddbProperties;
        this.tableName = SsmUtility.getParameterValue(ddbProperties.ordersTableParameterName());
        super.dbClient = super.createDBClient();
    }

    @Override
    protected String getTableName() {
        return this.tableName;
    }

    @Override
    protected Map<String, AttributeValue> getPutItemMap(Object hub_) {

        throw new UnsupportedOperationException();
    }

    public List<VisitOrder> listOrders() {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName)
                .build();

        return this.listOrders(scanRequest);
    }

    public List<VisitOrder> listOrders(String warehouseCode, String orderDate) {
        Map<String, AttributeValue> expressionAttributeValues = new HashMap<String, AttributeValue>();
        expressionAttributeValues.put(":valOrderDate", AttributeValue.builder().s(orderDate).build());
        expressionAttributeValues.put(":valWarehouseCode", AttributeValue.builder().s(warehouseCode).build());

        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName)
                .filterExpression("(orderDate = :valOrderDate) and (warehouseCode = :valWarehouseCode)")
                .expressionAttributeValues(expressionAttributeValues)
                .build();

        return this.listOrders(scanRequest);
    }

    private List<VisitOrder> listOrders(ScanRequest scanRequest) {
        List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();
        if (dbItems.size() == 0) {
            return null;
        }

        List<VisitOrder> orders = new ArrayList<>();
        for (Map<String, AttributeValue> dbItem : dbItems) {
            String orderId =dbItem.get("orderNo").s();
            String deliveryCode =dbItem.get("deliveryCode").s();
            int weight = Integer.parseInt(dbItem.get("sumWeight").n());
            orders.add(new VisitOrder(orderId, deliveryCode, weight));
        }

        return orders;
    }
}
