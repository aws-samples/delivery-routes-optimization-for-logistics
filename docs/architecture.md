# Architecture

## Solution Architecture

![Solution Architecture](imgs/architecture.png)

This project is a **serverless + ECS hybrid** system: an operator manages orders and master data through the web UI, external systems upload orders through an API, and the backend runs asynchronous batch optimization on an ECS-hosted dispatch engine. All resources are defined with AWS CDK and deployed as 5 CloudFormation stacks (see [`apps_infra/README.md`](../apps_infra/README.md#stack-architecture) for the full stack breakdown).

The diagram's components can be grouped into three areas.

### 1) Operator Path — Web UI + Web API

- **Management Website (Amazon CloudFront + S3)**
  A React 19 SPA (Cloudscape Design + MapLibre) is uploaded to the S3 "Website artifacts" bucket and served through CloudFront. It handles sign-in, UI rendering, map visualization, and CRUD screens.
- **Amazon Cognito**
  User Pool-based authentication. When an administrator account is created, a temporary password is emailed; every subsequent Web API call is authenticated with the Cognito ID token.
- **Web API (Amazon API Gateway) + Management Functions / Query Functions (AWS Lambda)**
  - **Management Functions** — Lambda handlers for CRUD operations on Warehouses / Vehicles / Customer Destinations / Orders / DistanceMatrix.
  - **Query Functions** — Lambda handlers that read execution results such as SolverJobs / DeliveryJobs.
  - API Gateway is protected by a Cognito Authorizer.
- **Data stores (Amazon DynamoDB)**
  Each domain object maps 1:1 to a DynamoDB table.
  - `Warehouses` — warehouse (departure point) master data
  - `CustomerDestinations` — delivery destinations including time group and priority
  - `Vehicles` — owned / contracted vehicle master data (capacity, grade, etc.)
  - `Orders` — per-day order ledger
  - `SolverJobs` — solver execution history (status, start/end times, score, etc.)
  - `DeliveryJobs` — optimization results (per-vehicle dispatch + visit order + route)

### 2) Order Ingestion Path — API Gateway + Async Pipeline

External systems upload order CSVs independently of the web UI, via the following flow.

1. `GET` the **Order Ingestion API (API Gateway + API Key)** → the **PresignedUrl Lambda** returns an S3 `PUT` presigned URL.
2. The client `PUT`s the order CSV to the **Order Backup (Amazon S3)** bucket using that URL.
3. The S3 `ObjectCreated` event triggers the **Order handler (Lambda)**, which parses the CSV and inserts rows into the `Orders` DynamoDB table.
4. **StartOptimizationTask (Lambda)** is invoked and asynchronously runs the Dispatch Engine ECS Task.

> The API Gateway front is protected with an **API Key + Usage Plan**, providing an external-system authentication path separate from Cognito.

### 3) Optimization Engine Path — ECS Task-based Batch Execution

- **DistanceMatrix Manager (Lambda) → DistanceMatrix Generator (ECS Task) → RoutingCache (S3)**
  When an operator triggers "Rebuild Distance Cache" in the web UI, the Manager Lambda launches an ECS task. The task uses GraphHopper + OSM data to compute a **road-based distance matrix** for every (warehouse ↔ customer, customer ↔ customer) pair, serializes it into the RoutingCache S3 bucket, and updates the distance-cache metadata table in DynamoDB.
- **Dispatch Engine (ECS Task, Java 21 + Spring Boot + OptaPlanner)**
  Triggered by an order upload or a web-UI request. It fetches environment parameters (table names, bucket names) from SSM Parameter Store, reads the relevant orders / vehicles / customers from DynamoDB, solves a VRPTW-style optimization problem with OptaPlanner, and writes the result (per-vehicle visit sequence + route) into the `SolverJobs` / `DeliveryJobs` tables. Scores are computed against the real road-distance matrix cached in S3.
- **SSM Parameter Store**
  Each stack publishes resource names it created (table / bucket / cluster / ECS task-definition ARN, etc.) as SSM parameters, and the ECS tasks and Lambdas look them up at runtime. This avoids direct cross-stack references (Export/Import) and prevents **circular dependencies** during stack deletions and re-deploys.

### 4) DevOps Pipeline (Bottom Section of the Diagram)

The DevOps section at the bottom represents a developer-facing pipeline. The original diagram shows **AWS CodeCommit → AWS CDK → AWS CloudFormation → Amazon CloudWatch**, but this repository only contains the CDK definitions — pipeline automation (CodeCommit / CodePipeline) is not included.

- **Infra as Code (AWS CDK)** — the `apps_infra/` module in this repository. Deploy locally with `pnpm synth` / `pnpm deploy:dev`.
- **Deploy (AWS CloudFormation)** — CloudFormation provisions the resources from the CDK-generated templates.
- **Service Logs (Amazon CloudWatch)** — Lambda / ECS / API Gateway logs are captured in CloudWatch Logs by default.

> For the end-to-end deploy and operate flow, see [`quickstart.md`](./quickstart.md).

---

## Domain Model

![Domain Model](imgs/domain_model.png)

The optimization engine defines the problem with **OptaPlanner** annotations: `@PlanningSolution` / `@PlanningEntity` / `@PlanningVariable` / `@ShadowVariable`.

- **`DispatchSolution`** — `@PlanningSolution`. The top-level container representing a single solver run. It receives all `PlanningVehicle`s and `PlanningVisit`s as input and holds the score OptaPlanner produces.
- **`PlanningVehicle`** — injected into the solution as `@ProblemFactCollectionProperty`. Has `id`, `carNo`, departure `location`, `maxCapacity`, and `nextPlanningVisit` (the start of its visit chain). Represents vehicle type (owned / contracted) and capacity constraints.
- **`PlanningVisit`** — `@PlanningEntity`. Represents **one delivery destination to visit**, and is the core entity the solver assigns (to a vehicle and a position in sequence).
  - `@PlanningVariable previousVisitOrVehicle` — picks the previous node, which may be a `PlanningVehicle` or another `PlanningVisit`. This is the variable the solver actually decides.
  - `@ShadowVariable nextPlanningVisit` / `planningVehicle` — shadow variables derived from the previous-node assignment. When the solver changes the upstream chain, they are automatically recomputed and used in score calculation and constraint checking.
- **`VisitOrVehicle`** (interface) — implemented by both `PlanningVehicle` and `PlanningVisit`. That is why `previousVisitOrVehicle` can point to either. In other words, **each vehicle is the head of a single linked chain, followed by a series of visits** — the solver models sequences as chains.
- **`Location`** / **`PlanningHub`** — the value object for a physical position (`Coordinate`) and the hub a vehicle departs from (the warehouse). They serve as lookup keys into the GraphHopper-based distance matrix.

The chain structure looks roughly like this:

```
Vehicle(A) → Visit#1 → Visit#2 → Visit#3 → (end)
Vehicle(B) → Visit#4 → Visit#5 → (end)
Vehicle(C) → (empty, idle vehicle)
```

Each `PlanningVisit` points back to its immediate predecessor via `previousVisitOrVehicle`, forming the chain. The solver explores alternative chain configurations and keeps the combination with the best (hard / medium / soft) score. The main constraints — vehicle capacity, time-group matching, owned-vehicle priority, and so on — are implemented as OptaPlanner Constraint Streams; see the [Demo Scenario](../README.md#demo-scenario) in the root README for the business rules that drive them.
