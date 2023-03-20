# `@infra/data-storage`

Data storage nested stack.

## Resources

This package creates the following persistent resources.

### DynamoDB tables

* `orders` - incoming orders
* `solverJobs` - solver job metadata
* `deliveryJobs` - delivery jobs to be assigned to vehicles
* `customerLocations` - customer location information
* `vehicles` - vehicle information

### S3 buckets

* `orderUploads` - uploaded batch orders

## Usage

```ts
import { DataStorage } from '@infra/data-storage'

const dataStorage = new DataStorage(this, 'DataStorage', {
    parameterStoreKeys // loaded from config
})
```
