/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */
package dev.aws.proto.apps.appcore.data;

import dev.aws.proto.core.util.aws.CredentialsHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Base for service classes to retrieve data form DynamoDB.
 * TODO: switch to https://sdk.amazonaws.com/java/api/latest/software/amazon/awssdk/enhanced/dynamodb/DynamoDbEnhancedClient.html
 */
public abstract class DdbServiceBase {
    /**
     * The DDB client.
     */
    protected DynamoDbClient dbClient;

    /**
     * Create a DDB client
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
     * Override this the get the table name to operate on.
     *
     * @return The name of the DDB table.
     */
    protected abstract String getTableName();

    /**
     * List of the scan attributes. Override is optional.
     *
     * @return The list of the attributes.
     */
    protected String[] scanAttributes() {
        return null;
    }

    /**
     * Override this to assemble the attribute map for your update/create item.
     *
     * @param item The data item to persist in the database.
     * @return The "key"-"attribute value" pairs to persist in DDB.
     */
    protected abstract Map<String, AttributeValue> getPutItemMap(Object item);

    /**
     * Create a scan request.
     *
     * @return ScanRequest instance.
     */
    protected ScanRequest scanRequest() {
        return ScanRequest.builder()
                .tableName(this.getTableName())
                .build();
    }

    /**
     * Create a scan request with attributes.
     *
     * @return ScanRequest instance.
     */
    protected ScanRequest scanRequestWithAttributes() {
        return ScanRequest.builder()
                .tableName(this.getTableName())
                .attributesToGet(this.scanAttributes())
                .build();
    }

    /**
     * Create a get item request.
     *
     * @param idAttributeName Name of the ID attribute
     * @param id              Value of the ID.
     * @return GetItemRequest instance.
     */
    protected GetItemRequest getItemRequest(String idAttributeName, Object id) {
        Map<String, AttributeValue> key = new HashMap<>();
        key.put(idAttributeName, AttributeValue.builder().s(id.toString()).build());

        return GetItemRequest.builder()
                .tableName(this.getTableName())
                .key(key)
                .build();
    }

    /**
     * Create a get query request.
     *
     * @param idAttributeName Name of the ID attribute.
     * @param id              Value of the ID.
     * @return QueryRequest instance.
     */
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

    /**
     * Create a put item request.
     *
     * @param item The item to update/create.
     * @return PutItemRequest instance.
     */
    protected PutItemRequest putRequest(Object item) {
        Map<String, AttributeValue> itemMap = this.getPutItemMap(item);

        return PutItemRequest.builder()
                .tableName(getTableName())
                .item(itemMap)
                .build();
    }
}
