/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

package dev.aws.proto.apps.nextday.domain.planning.builder;

import dev.aws.proto.apps.nextday.domain.planning.Customer;
import dev.aws.proto.apps.nextday.domain.planning.PlanningVisit;
import dev.aws.proto.apps.nextday.domain.planning.VisitOrder;
import dev.aws.proto.apps.nextday.location.Location;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class PlanningVisitListBuilder {
    private static final Logger logger = LoggerFactory.getLogger(PlanningVisitListBuilder.class);

    private List<VisitOrder> orders;
    private Map<String, Customer> customers;
    private Map<String, Location> locationMap;

    private PlanningVisitListBuilder(List<VisitOrder> orders, Map<String, Customer> customers, Map<String, Location> locationMap) {
        this.orders = orders;
        this.customers = customers;
        this.locationMap = locationMap;
    }

    public static PlanningVisitListBuilder builder(List<VisitOrder> orders, Map<String, Customer> customers, Map<String, Location> locationMap){
        return new PlanningVisitListBuilder(orders, customers, locationMap);
    }

    public List<PlanningVisit> build(){
        List<PlanningVisit> planningVisits = new ArrayList<>();
        for(int i = 0 ; i < orders.size() ; i++) {
            VisitOrder order = orders.get(i);
            Customer customer = customers.get(order.getDestinationId());
            if(customer == null) {
                logger.warn("CANNOT FIND CUSTOMER -> order id : {} , destinationId {}", order.getOrderId(), order.getDestinationId());
                continue;
            }

            PlanningVisit v = new PlanningVisit();
            v.setId(order.getOrderId());
            v.setOrderId(order.getOrderId());
            v.setLocation(locationMap.get(order.getDestinationId()));
            v.setDeliveryCode(customer.getDeliveryCode());
            v.setDeliveryName(customer.getDeliveryName());
            v.setDemands(order.getSumWeight());
            v.setDeliveryTimeGroup(customer.getDeliveryTimeGroup());
            planningVisits.add(v);
        }
        return planningVisits;
    }
}
