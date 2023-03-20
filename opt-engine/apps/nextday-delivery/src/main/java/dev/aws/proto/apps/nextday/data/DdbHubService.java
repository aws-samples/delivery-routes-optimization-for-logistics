/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.data;

import dev.aws.proto.apps.appcore.data.DdbServiceBase;
import dev.aws.proto.apps.nextday.config.DdbProperties;
import dev.aws.proto.apps.nextday.domain.planning.PlanningHub;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.util.aws.SsmUtility;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DdbHubService extends DdbServiceBase {
    private static final Logger logger = LoggerFactory.getLogger(DdbHubService.class);

    @Inject
    DdbProperties ddbProperties;

    private final String tableName;

    DdbHubService(DdbProperties ddbProperties) {
        this.ddbProperties = ddbProperties;
        this.tableName = SsmUtility.getParameterValue(ddbProperties.hubsTableParameterName());
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

    public List<PlanningHub> listHubs() {
        logger.debug("Loading hubs");

        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName)
                .build();

        List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();
        if (dbItems.size() == 0) {
            return null;
        }

        List<PlanningHub> hubs = new ArrayList<>();
        for (Map<String, AttributeValue> dbItem : dbItems) {
            Coordinate coord = new Coordinate();
            double latitude    =  Double.parseDouble(dbItem.get("latitude").n());
            double longitude   =  Double.parseDouble(dbItem.get("longitude").n());
            coord.setLatitude(latitude);
            coord.setLongitude(longitude);

            hubs.add(new PlanningHub(dbItem.get("warehouseCode").s(), dbItem.get("warehouseName").s(), coord));
        }

        logger.info("Loaded {} hubs", hubs.size());

        return hubs;
    }
}
