import * as cdk from "aws-cdk-lib";
import { Capture, Template } from "aws-cdk-lib/assertions";
import * as LambdaStack from "../lib/lambda-stack";

// Build the stack once and share the template: synthesizing per test is slow.
// "aws:cdk:bundling-stacks": [] skips the esbuild bundling of the Lambdas,
// which these tests don't need.
const app = new cdk.App({ context: { "aws:cdk:bundling-stacks": [] } });
const stack = new LambdaStack.LambdaStack(app, "MyTestStack", {
  stageName: "Dev",
});
const template = Template.fromStack(stack);

test("DynamoDB Table Created", () => {
  template.resourceCountIs("AWS::DynamoDB::Table", 1);
  template.hasResource("AWS::DynamoDB::Table", {
    Properties: {
      TableName: "DevweatherApiTable",
    },
  });
});

test("ApiGateway RestApi Created", () => {
  template.hasResource("AWS::ApiGateway::RestApi", {
    Properties: {
      Name: "Dev Weather Rest Api",
    },
  });
});

test("5 Lambda Functions Created", () => {
  template.resourceCountIs("AWS::Lambda::Function", 5);
});

test("Create Lambda Function exists with table and stage environment variables", () => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "Dev-cdk-typescript-create",
  });

  // The course hard-codes a table logical id; read the real one from the
  // template so the test doesn't break when CDK changes the id hash.
  const tableLogicalId = Object.keys(
    template.findResources("AWS::DynamoDB::Table")
  )[0];

  const envCapture = new Capture();
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: "Dev-cdk-typescript-create",
    Environment: envCapture,
  });
  expect(envCapture.asObject()).toEqual({
    Variables: {
      TABLE_NAME: { Ref: tableLogicalId },
      STAGE_NAME: "Dev",
    },
  });
});

test.each([
  ["Dev-cdk-typescript-get"],
  ["Dev-cdk-typescript-update"],
  ["Dev-cdk-typescript-delete"],
  ["Dev-cdk-typescript-list"],
])("Lambda %s exists", (functionName) => {
  template.hasResourceProperties("AWS::Lambda::Function", {
    FunctionName: functionName,
  });
});

test("API exposes the five CRUDL methods", () => {
  const methods = Object.values(
    template.findResources("AWS::ApiGateway::Method")
  )
    .map((m) => m.Properties.HttpMethod)
    .sort();
  expect(methods).toEqual(["DELETE", "GET", "GET", "POST", "PUT"]);
});
