#!/usr/bin/env node

const cdk = require("aws-cdk-lib");
const { RdsReplicationStack } = require("../lib/rds-replication-stack");

const app = new cdk.App();
new RdsReplicationStack(app, "RdsReplicationStack", {});
