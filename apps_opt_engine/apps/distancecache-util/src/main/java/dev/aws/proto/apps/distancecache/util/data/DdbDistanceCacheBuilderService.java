/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.distancecache.util.data;

import dev.aws.proto.core.util.aws.CredentialsHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class DdbDistanceCacheBuilderService {
    private static final Logger logger = LoggerFactory.getLogger(DdbDistanceCacheBuilderService.class);

    private final DynamoDbClient client;
    private final String tableName;

    public DdbDistanceCacheBuilderService(String tableName) {
        this.tableName = tableName;
        this.client = DynamoDbClient.builder()
                .credentialsProvider(CredentialsHelper.getCredentialsProvider())
                .region(CredentialsHelper.getRegion())
                .build();
    }

    public List<Map<String, String>> getLocationList(String warehouseCode) {
        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":valWarehouseCode", AttributeValue.builder().s(warehouseCode).build());

        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName)
                .filterExpression("warehouseCode = :valWarehouseCode")
                .expressionAttributeValues(expressionAttributeValues)
                .build();
        List<Map<String, AttributeValue>> dbItems = client.scan(scanRequest).items();

        List<Map<String, String>> res = new ArrayList<>();
        for (Map<String, AttributeValue> item : dbItems) {
            Map<String, String> resItem = new HashMap<>();
            for (String key : item.keySet()) {
                AttributeValue v = item.get(key);
                String value = null;
                if (AttributeValue.Type.S.equals(v.type())) value = v.s();
                else if (AttributeValue.Type.N.equals(v.type())) value = v.n();

                resItem.put(key, value);
            }
            res.add(resItem);
        }
        return res;
    }

    public void putBuildResult(String warehouseCode, String buildTime, int numOfLocations, String status, String reason) {
        Map<String, AttributeValue> itemMap = new HashMap<>();
        itemMap.put("Id", AttributeValue.builder().s(UUID.randomUUID().toString()).build());
        itemMap.put("warehouseCode", AttributeValue.builder().s(warehouseCode).build());
        itemMap.put("buildTime", AttributeValue.builder().s(buildTime).build());
        itemMap.put("numOfLocations", AttributeValue.builder().n(String.valueOf(numOfLocations)).build());
        itemMap.put("status", AttributeValue.builder().s(status).build());
        itemMap.put("reason", AttributeValue.builder().s(reason).build());

        PutItemRequest req = PutItemRequest.builder()
                .tableName(this.tableName)
                .item(itemMap)
                .build();

        client.putItem(req);
    }
}
