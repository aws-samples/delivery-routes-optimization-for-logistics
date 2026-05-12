# Utility Scripts

Helper scripts for development and testing of the delivery-routes-optimization infrastructure.

## Prerequisites

- AWS CLI v2 configured with appropriate credentials
- `jq` installed for JSON parsing
- Environment variables or AWS profile configured

## Configuration

Scripts read configuration from environment variables:

| Variable    | Default        | Description                |
| ----------- | -------------- | -------------------------- |
| `AWS_PROFILE` | (default)    | AWS CLI profile to use     |
| `AWS_REGION`  | `us-east-1`  | Target AWS region          |

You can also create a `.env` file in the project root to set these.

## Scripts

| Script                              | Description                                                    |
| ----------------------------------- | -------------------------------------------------------------- |
| `dev-sample-order.sh`               | Insert sample order items into DynamoDB Orders table           |
| `upload-master-data.sh`             | Upload warehouse, customer location, and vehicle master data   |
| `upload-order-with-presigned-url.sh`| Upload order CSV via pre-signed URL (API Gateway flow)         |
| `open-demo-webui.sh`               | Open the deployed demo web UI in the browser                   |
| `pull-appvars-js.sh`               | Pull the generated `appvars.js` from S3 for local development |

## Usage

```bash
# Set your profile and region (optional, defaults apply)
export AWS_PROFILE=my-profile
export AWS_REGION=us-east-1

# Upload master data first
./scripts/upload-master-data.sh

# Then upload sample orders
./scripts/dev-sample-order.sh
```
