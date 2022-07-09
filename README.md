# RDS replication REST API

## TL;DR

- "UI" deployed to https://rdsreplicationstack-swaggerui171a0d8e-1ujrtord2a1sz.s3.eu-west-1.amazonaws.com/index.html

## Solution deployment

### Prerequisite

- NodeJS 14;
- Docker.

### Deployment

- configure AWS CLI profile `roboten`;
- run `make bootstrap`;
- run `make deploy`;
- go to Swagger UI available in created S3 public bucket or run `npx static-server` from `resources/ui` folder;
- create two PostgreSQL v12 databases publicly accessible from the Internet (see security points in the "Not solved" section below).

## Description

The project consists of AWS [CDK stack](lib/rds-replication-stack.js) with:

- API Gateway;
- Three lambdas:
  - [identical.js](resources/identical.js) - runs `pg_dump | psql`;
  - [masked.js](resources/masked.js) - runs:
    - `pg_dump -s | psql`;
    - Copies tables in the order hardcoded in the array (not the best solution);
    - If the table is presented in the request together with fields to mask:
      - dumps it to CSV and masks columns. In general, for obvious reasons, would be good to avoid dumping the data to the disk and stream it directly to the target instance. Max available ephemeral storage for lambda is 10Gb;
      - loads CSV to target instance with `COPY table FROM ...`;
  - [partial.js](resources/partial.js) - just a dummy one. Didn't make it in time, see details in the "Not solved" section below. Though REST API schema is presented in [spec.yaml](resources/ui/spec.yaml)
- S3 bucket to host Swager UI.

## Thoughts

- All the "flavours" of DB copies look pretty much the same and could be merged into one REST API endpoint with body parameters like:
  - mask: true;
  - onlyTenants: [1, 23, 4];
- Instead of having several Lambdas I would consider merging them into a single express app and deploying it as a single Lambda. That would allow better utilization of handwritten OpenAPI specification for request/response validation and sanitization. But because of the requirements, I decided to avoid the usage of express.js;
- Because we have several Lambdas "the UI" (Swagger UI) is deployed as a separate static website to the public S3 bucket. I didn't use CloudFront to focus more on the backend part;
- Could be migrated to TypeScript to support better typing and fluent development. Out of the scope ATM;
- Pseudonymization could be used instead of masking. It may provide the team with useful insights.

## Not solved

- Task 2 "Copy just a set of the data in the database" was not solved because of two reasons:
  - Probably spent too much time making the project easily deployable;
  - Maybe I misunderstood the task but it looks like [the dataset](https://en.wikiversity.org/wiki/Database_Examples/Northwind) could not be used as it is because tenants information is missing. First, what comes to my mind is to add TenantID to every table, but I guess there could be a better solutions;
- Security:
  - REST API security: "Security through obscurity" - AWS API gateway generates non-human readable domain names like https://[ALPHA-NUMERIC-ID].execute-api.eu-west-1.amazonaws.com/prod that are hard to guess. Better would be to have, at least, API key but run out of time;
  - Access to databases. Requirement: "The main purpose of this API (but there could be more purposes) would be to create a development environment that leaves out some of the data." may mean that we are copying a database from PROD AWS account to DEV account. Thus to do the copy the lambdas have to assume the roles from those two accounts. Three AWS accounts are required to properly test it. The current solution assumes that lambdas have all the rights to operate and runs inside a single AWS account. No role assumption is implemented;
  - Due to several reasons, NodeJS v14 is selected as a runtime though a more up-to-date version would be better to use;
- Adding read replica "PROD DB" to avoid performance issues would be good;
- Creating a dump can take a while. But even if the execution takes two minutes it is bad behavior for REST API and API gateway will throw a timeout. Thus a better solution would be to run a task on Fargate and provide REST API to query the status of the task;
- REST API URL is hardcoded into the specification.
