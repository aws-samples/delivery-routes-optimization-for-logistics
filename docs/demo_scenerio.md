# Demo Scenerio

## 1. Scenerio

### Optimize order dispatching and delivery route for medical supplies

* Customers are hospitals in Seoul, Korea. And they order medical supplies daily.
* Orders are dispatched once a day.
* All deliveries start from a warehouse.
* The customer has delivery priority.
* There can be multiple orders by single customer.
* By default, the orders are delivered by company-owned vehicle,
    but if there are a lot of orders, it can use temporary contracted vehicles.


## 2. Business considerations

* Orders are dispatched to vehicles with considering vehicle capacity.
* Find shorter distance for delivering trips.
* Orders must be delivered by vehicles with a time group earlier than the ordering customer's time group.
* Multiple orders from a single customer should preferably be delivered by a single vehicle.
* Orders must be assigned priority to company-owned vehicles.
* Temporary contract vehicles are used when all company-owned vehicles are used.