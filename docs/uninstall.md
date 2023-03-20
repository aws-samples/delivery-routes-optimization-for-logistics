# Uninstall the solution

To uninstall the example project you have deployed into your AWS account, you need to delete the stacks in CloudFormation, as well as manually remove the S3 buckets and DynamoDB tables.

### Delete the stacks

1. Navigate to `apps/infra`
1. Type the command `yarn dev:DESTROY:all`

This will remove your stacks.

## Deleting the Amazon S3 buckets

After the stack deletion has completed, delete the Amazon S3 bucket.

1. Sign in to the Amazon S3 console.
1. Select the buckets that start with the namespace you set in the configuration before deployment. For example, if you set the namespace to `devproto`, look for a bucket named `devproto-xxx`.
1. Back up the data in that bucket that you want to keep, such as by copying the data to another S3 bucket where you keep all your backups.
1. Choose Empty.
1. Choose Delete.

## Deleting the DynamoDB tables

Delete the two tables that contain metadata about your dashboard and datasets.

1. Sign in to the DynamoDB console.
1. Select the tables that start with the namespace you set in the configuration before deployment.
1. Choose Delete table.
1. Type delete, and choose Delete.
1. Select the table that starts with the same name as your stack, and has the string MainTable in the name.
1. Choose Delete table.
1. Type delete, and choose Delete.