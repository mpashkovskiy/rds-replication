const { Stack, RemovalPolicy, Duration } = require("aws-cdk-lib");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const lambda = require("aws-cdk-lib/aws-lambda");
const s3 = require("aws-cdk-lib/aws-s3");
const s3Deployment = require("aws-cdk-lib/aws-s3-deployment");

class RdsReplicationStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // REST APIs
    const api = new apigateway.RestApi(this, "copy-api", {
      restApiName: "Copy Service",
    });
    const cats = api.root
      .addResource("v1")
      .addResource("dbs")
      .addResource("categories");
    ["identical", "partial", "masked"].forEach((cat) => {
      const functionName = `${cat}-handler`;
      const handler = new lambda.DockerImageFunction(this, functionName, {
        functionName,
        code: lambda.DockerImageCode.fromImageAsset(".", {
          cmd: [`${cat}.main`],
        }),
        memorySize: 2048,
        timeout: Duration.minutes(15),
        // ephemeralStorageSize: 1024,
        environment: {},
      });
      const integration = new apigateway.LambdaIntegration(handler, {
        requestTemplates: { "application/json": '{ "statusCode": "200" }' },
      });
      const catRes = cats.addResource(cat);
      catRes.addCorsPreflight({
        allowHeaders: ["Content-Type"],
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ["POST"],
      });
      catRes.addMethod("POST", integration);
    });

    // UI
    const websiteBucket = new s3.Bucket(this, "swagger-ui", {
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteIndexDocument: "index.html",
    });
    new s3Deployment.BucketDeployment(this, "websiteDeployment", {
      sources: [s3Deployment.Source.asset("resources/ui")],
      destinationBucket: websiteBucket,
    });
  }
}

module.exports = { RdsReplicationStack };
