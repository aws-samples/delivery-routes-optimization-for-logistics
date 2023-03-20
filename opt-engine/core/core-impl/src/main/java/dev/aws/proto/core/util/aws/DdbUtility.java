/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.core.util.aws;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DdbUtility {
    private static final Logger logger = LoggerFactory.getLogger(DdbUtility.class);

    private DynamoDbClient client;

    public DdbUtility(){
        this.client =  DynamoDbClient.builder()
                .credentialsProvider(CredentialsHelper.getCredentialsProvider())
                .region(CredentialsHelper.getRegion())
                .build();
    }

    public List<Map<String, String>> scanTable(String tableName){
        // query
        ScanRequest scanRequest = ScanRequest.builder().tableName(tableName).build();
        List<Map<String, AttributeValue>> dbItems = client.scan(scanRequest).items();

        // convert data
        List<Map<String, String>> res = new ArrayList<>();
        for(Map<String, AttributeValue> item : dbItems) {

            Map<String, String> resItem = new HashMap<>();
            for(String key : item.keySet()) {
                AttributeValue v = item.get(key);
                String value = null;
                if( AttributeValue.Type.S.equals(v.type()) ) value = v.s();
                else if( AttributeValue.Type.N.equals(v.type()) ) value = v.n();

                resItem.put(key, value);
            }
            res.add(resItem);
        }
        return res;
    }
}
