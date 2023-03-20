/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.data;

import dev.aws.proto.apps.appcore.data.DdbServiceBase;
import dev.aws.proto.apps.nextday.config.DdbProperties;
import dev.aws.proto.apps.nextday.domain.planning.Customer;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.apps.nextday.location.DropoffLocation;
import dev.aws.proto.apps.nextday.location.Location;
import dev.aws.proto.core.routing.location.Coordinate;
import dev.aws.proto.core.routing.location.ILocation;
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

import static dev.aws.proto.core.routing.location.LocationType.DESTINATION;

@ApplicationScoped
public class DdbCustomerLocationService extends DdbServiceBase {
    private static final Logger logger = LoggerFactory.getLogger(DdbCustomerLocationService.class);

    @Inject
    DdbProperties ddbProperties;

    private final String tableName;

    DdbCustomerLocationService(DdbProperties ddbProperties) {
        this.ddbProperties = ddbProperties;
        this.tableName = SsmUtility.getParameterValue(ddbProperties.customerLocationsTableParameterName());
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

   public List<PlanningVisit> listCustomers() {
       ScanRequest scanRequest = ScanRequest.builder()
               .tableName(this.tableName)
               .build();

       List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();
       if (dbItems.size() == 0) {
           return null;
       }

       List<PlanningVisit> customers = new ArrayList<>();
       for (Map<String, AttributeValue> dbItem : dbItems) {
           String warehouseCode = dbItem.get("warehouseCode").s();
           String deliveryCode = dbItem.get("deliveryCode").s();
           String deliveryName = dbItem.get("deliveryName").s();
           int deliveryTimeGroup = Integer.parseInt(dbItem.getOrDefault("deliveryTimeGroup", AttributeValue.fromS("5")).s());

           Coordinate coord = new Coordinate();
           double latitude = Double.parseDouble(dbItem.get("latitude").n());
           double longitude = Double.parseDouble(dbItem.get("longitude").n());
           coord.setLatitude(latitude);
           coord.setLongitude(longitude);

           Location loc = new Location();

           loc.setId(deliveryCode);
           loc.setCoordinate(coord);
           loc.setLocationType(DESTINATION);

           customers.add(new PlanningVisit(warehouseCode, deliveryCode, deliveryName, deliveryTimeGroup, loc));
       }

       return customers;
   }

    public Map<String, Customer> dictCustomers() {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(this.tableName)
                .build();

        List<Map<String, AttributeValue>> dbItems = super.dbClient.scan(scanRequest).items();
        if (dbItems.size() == 0) {
            return null;
        }

        Map<String, Customer> customers = new HashMap<>();
        for (Map<String, AttributeValue> dbItem : dbItems) {
            String id = dbItem.get("Id").s();
            String warehouseCode = dbItem.get("warehouseCode").s();
            String deliveryCode = dbItem.get("deliveryCode").s();
            String deliveryName = dbItem.get("deliveryName").s();
            String address = dbItem.getOrDefault("address", AttributeValue.fromS("")).s();
            int deliveryTimeGroup = Integer.parseInt(dbItem.getOrDefault("deliveryTimeGroup", AttributeValue.fromS("5")).s());
            double latitude = Double.parseDouble(dbItem.get("latitude").n());
            double longitude = Double.parseDouble(dbItem.get("longitude").n());


            Customer customer = new Customer(
                    id,
                    warehouseCode,
                    deliveryCode,
                    deliveryName,
                    address,
                    deliveryTimeGroup,
                    latitude,
                    longitude
            );

            customers.put(deliveryCode, customer);
        }

        return customers;
    }

    public Map<String, Location> toLocations(Map<String, ILocation> locationMap) {
        logger.debug("Loading locations");
        Map<String, Location> locations = new HashMap<>();
        for(String id : locationMap.keySet()){
            Location loc = new DropoffLocation(id, locationMap.get(id).coordinate());
            locations.put(id, loc);
        }
        return locations;
    }
}
