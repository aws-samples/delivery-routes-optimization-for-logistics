/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.data;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aws.proto.apps.appcore.api.response.UnitValue;
import dev.aws.proto.apps.appcore.data.DdbServiceBase;
import dev.aws.proto.apps.nextday.config.DdbProperties;
import dev.aws.proto.apps.nextday.domain.planning.capacity.MaxCapacity;
import dev.aws.proto.core.util.aws.SsmUtility;
import org.bk.aws.dynamo.util.JsonAttributeValueUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVehicle;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@ApplicationScoped
public class DdbVehicleService extends DdbServiceBase {
    private static final Logger logger = LoggerFactory.getLogger(DdbVehicleService.class);

    public static class UnitValueStringFloat extends UnitValue<String, Float> {
    }

    public static class UnitValueStringInt extends UnitValue<String, Integer> {
    }

    @Inject
    DdbProperties ddbProperties;

    final String tableName;

    @Override
    protected String getTableName() {
        return this.tableName;
    }

    DdbVehicleService(DdbProperties ddbProperties) {
        this.ddbProperties = ddbProperties;
        this.tableName = SsmUtility.getParameterValue(ddbProperties.vehicleCapacityTableParameterName());
        this.dbClient = super.createDBClient();

        logger.trace("DdbVehicleCapacityService instantiated :: tableName = {}", this.tableName);
    }

    @Override
    protected Map<String, AttributeValue> getPutItemMap(Object item) {
        throw new UnsupportedOperationException("Only READ is allowed for this table");
    }

      /* public List<Vehicle> getVehicles(){
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName).build();

        List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();
        if (dbItems.size() == 0) {
            return null;
        }

        List<Vehicle> vl = new ArrayList<>();

        for (Map<String, AttributeValue> dbItem : dbItems) {
            String id = dbItem.get("Id").s();
            String carNo = dbItem.get("carNo").s();
            long maxWeight = Long.parseLong(dbItem.get("maxWeight").n());
            vl.add(new Vehicle(id, carNo, maxWeight));
        }

        return vl;
    }*/

    public List<PlanningVehicle> listPlanningVehicle(){
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName).build();

        List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();

        if (dbItems.size() == 0) {
            return null;
        }

        List<PlanningVehicle> vehicles = new ArrayList<>();
        for (Map<String, AttributeValue> dbItem : dbItems) {
            String id = dbItem.get("Id").s();
            String warehouseCode = dbItem.get("warehouseCode").s();
            String carNo = dbItem.get("carNo").s();
            Integer maxWeight = Integer.parseInt(dbItem.get("maxWeight").n());
            MaxCapacity maxCapacity = MaxCapacity.builder().weight(maxWeight).build();
            String carGrade = dbItem.get("carGrade").s();

            vehicles.add(new PlanningVehicle(id, warehouseCode, carNo, maxCapacity, carGrade, true));
         }

        logger.info("Loaded {} vehicles size", vehicles.size());
        return vehicles;
    }

    /**
     * Loads max capacity settings from the database.
     * <p>
     * <b>IMPORTANT:</b>
     * <li>Internally we don't use units. It is the implementer's responsibility to do any conversion necessary</li>
     * <li>If the units differ in the dispatch-request payload from these, you must sync them</li>
     *
     * @return The lookup table for {@link MaxCapacity} items
     */
    public Map<String, MaxCapacity> getMaxCapacities() {
        logger.debug("Loading vehicle capacities");

        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName).build();

        List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();
        if (dbItems.size() == 0) {
            return null;
        }

        Map<String, MaxCapacity> maxCapacities = new HashMap<>();
        ObjectMapper mapper = new ObjectMapper();

        for (Map<String, AttributeValue> dbItem : dbItems) {
            try {
                String id = dbItem.get("ID").s();
                UnitValue<String, Integer> length = mapper.treeToValue(JsonAttributeValueUtil.fromAttributeValue(dbItem.get("length")), UnitValueStringInt.class);
                UnitValue<String, Integer> height = mapper.treeToValue(JsonAttributeValueUtil.fromAttributeValue(dbItem.get("height")), UnitValueStringInt.class);
                UnitValue<String, Integer> width = mapper.treeToValue(JsonAttributeValueUtil.fromAttributeValue(dbItem.get("width")), UnitValueStringInt.class);
                UnitValue<String, Integer> weight = mapper.treeToValue(JsonAttributeValueUtil.fromAttributeValue(dbItem.get("weight")), UnitValueStringInt.class);
                MaxCapacity maxCap = MaxCapacity.builder()
                        .length(length.getValue())
                        .height(height.getValue())
                        .width(width.getValue())
                        .weight(weight.getValue())
                        .build();
                maxCapacities.put(id, maxCap);
            } catch (JsonProcessingException e) {
                logger.error("Error parsing vehicle capacity ddbItem", e);
            }
        }

        return maxCapacities;
    }

}
