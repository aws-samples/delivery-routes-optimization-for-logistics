# Optimize Delivery Route and Order Dispatching for Next-day Delivery Service

![Demo Screenshot](./docs/imgs/demo_screenshot.png)

## Introduction

In logistics, deciding **which vehicle should carry each order and in what sequence it should drive along real roads** is a classic yet still challenging problem. You must simultaneously satisfy business constraints — vehicle capacity, customer priority, time windows, owned vs. contracted fleet — while keeping the total driving distance close to optimal.

This project is a **sample application** that tackles the problem.

- **Problem domain**: Order **dispatching** and **route optimization** for next-day delivery services.
- **Approach**
  - Solves the problem as a VRPTW-style multi-objective (hard / medium / soft) score model with [OptaPlanner](https://www.optaplanner.org/).
  - Computes **real road-graph** distances and travel times with [GraphHopper](https://www.graphhopper.com/) on OpenStreetMap (OSM) data.
  - Runs the whole system on AWS — defined with [AWS CDK](https://aws.amazon.com/cdk/), executed on serverless + ECS, and visualized in a React-based web UI.

After uploading the day's orders, an operator can immediately review the per-vehicle dispatch result and the actual driving route on the map.

---

## Demo Scenario

The bundled sample data models a **same-day medical-supply delivery to hospitals in Seoul, Korea**.

**Scenario**
- Customers are hospitals in Seoul that order medical supplies every day.
- Orders are dispatched once per day as a batch.
- Every delivery starts from a single warehouse.
- Customers have delivery priorities.
- A single customer may place multiple orders.
- Orders are delivered by company-owned vehicles by default; on busy days, temporarily contracted vehicles are also used.

**Business Considerations**
- Orders are dispatched to vehicles with respect to vehicle capacity.
- Total driving distance must be minimized.
- An order must be delivered by a vehicle whose **time group is earlier than** the ordering customer's time group.
- Multiple orders from the same customer should preferably be handled by a single vehicle in one trip.
- Company-owned vehicles are assigned first; contracted vehicles are only used when all owned vehicles are saturated.

This scenario and its data (`apps_infra/scripts/data/sample_order.csv`) let you reproduce the optimization result in the deployed environment. See [Quickstart §3 Run Demo](./docs/quickstart.md#3-run-demo) for the walkthrough.

---

## Documentation

* [Quickstart Guide](./docs/quickstart.md)
  * Requirements and tech-stack versions
  * AWS credential setup, build order (Optimization Engine → Web → Infra), and deploy
  * Running the demo (master data → distance cache → order upload) and uninstall

* [Architecture](./docs/architecture.md)
  * Solution architecture diagram
  * Domain model

## Project Governance

* [`CHANGELOG.md`](./CHANGELOG.md) — Release notes
* [`CONTRIBUTING.md`](./CONTRIBUTING.md) — Bug reports and pull-request workflow
* [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) — Amazon Open Source Code of Conduct
* [`LICENSE`](./LICENSE) — MIT-0
* [`LICENSE_THIRDPARTY.txt`](./LICENSE_THIRDPARTY.txt) — License list of every npm / Maven / Gradle dependency used across the workspaces

---

## Repository Layout

```
.
├── apps_opt_engine/   # Optimization Engine (Java 21 + Spring Boot + OptaPlanner + GraphHopper)
├── apps_web/          # Web App (React 19 + Vite + Cloudscape + MapLibre)
├── apps_infra/        # Infrastructure-as-Code (AWS CDK + TypeScript, single pnpm package)
└── docs/              # Project documentation (quickstart, architecture, images)
```

---

## References

This sample project refers to [AWS Last Mile Delivery Hyperlocal — Last Mile Logistics](https://github.com/aws-samples/aws-last-mile-delivery-hyperlocal).

## License

This sample project is licensed under the MIT-0. See the [`LICENSE`](./LICENSE) file.
