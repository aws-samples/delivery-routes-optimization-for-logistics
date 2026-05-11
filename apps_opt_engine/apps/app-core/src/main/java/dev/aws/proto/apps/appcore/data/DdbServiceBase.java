/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.appcore.data;

import dev.aws.proto.core.util.aws.CredentialsHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.QueryRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;

import java.util.HashMap;
import java.util.Map;

/**
 * Base for service classes to retrieve data from DynamoDB.
 */
public abstract class DdbServiceBase {
    /** The DDB client. */
    protected DynamoDbClient dbClient;

    /**
     * Create a DDB client.
     *
     * @return The properly set up DDB client.
     */
    protected DynamoDbClient createDBClient() {
        return DynamoDbClient.builder()
                .credentialsProvider(CredentialsHelper.getCredentialsProvider())
                .region(CredentialsHelper.getRegion())
                .build();
    }

    /**
     * Override this to get the table name to operate on.
     */
    protected abstract String getTableName();

    /**
     * List of the scan attributes. Override is optional.
     */
    protected String[] scanAttributes() {
        return null;
    }

    /**
     * Override this to assemble the attribute map for your update/create item.
     */
    protected abstract Map<String, AttributeValue> getPutItemMap(Object item);

    protected ScanRequest scanRequest() {
        return ScanRequest.builder()
                .tableName(this.getTableName())
                .build();
    }

    protected ScanRequest scanRequestWithAttributes() {
        return ScanRequest.builder()
                .tableName(this.getTableName())
                .attributesToGet(this.scanAttributes())
                .build();
    }

    protected GetItemRequest getItemRequest(String idAttributeName, Object id) {
        Map<String, AttributeValue> key = new HashMap<>();
        key.put(idAttributeName, AttributeValue.builder().s(id.toString()).build());

        return GetItemRequest.builder()
                .tableName(this.getTableName())
                .key(key)
                .build();
    }

    protected QueryRequest getQueryRequest(String idAttributeName, Object id) {
        Map<String, String> expressionAttributeNames = new HashMap<>();
        expressionAttributeNames.put("#" + idAttributeName, idAttributeName);

        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":" + idAttributeName + "Value", AttributeValue.builder().s(id.toString()).build());

        return QueryRequest.builder()
                .tableName(this.getTableName())
                .keyConditionExpression(String.format("#%s = :%sValue", idAttributeName, idAttributeName))
                .expressionAttributeNames(expressionAttributeNames)
                .expressionAttributeValues(expressionAttributeValues)
                .build();
    }

    protected PutItemRequest putRequest(Object item) {
        Map<String, AttributeValue> itemMap = this.getPutItemMap(item);

        return PutItemRequest.builder()
                .tableName(getTableName())
                .item(itemMap)
                .build();
    }
}
