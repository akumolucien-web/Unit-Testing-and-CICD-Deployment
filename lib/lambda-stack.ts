import { Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as apigw from "aws-cdk-lib/aws-apigateway";

interface LambdaStackProps extends StackProps {
  stageName: string;
}

export class LambdaStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id, props);

    /*********************************************
     * DynamoDB table (one per stage: dev / prod)
     *********************************************/
    const table: dynamodb.Table = new dynamodb.Table(
      this,
      `${props.stageName}WeatherApiTable`,
      {
        tableName: `${props.stageName}weatherApiTable`,
        partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    /*********************************************
     * API Gateway REST API
     *********************************************/
    const weatherApi: apigw.RestApi = new apigw.RestApi(
      this,
      `weather_rest_api`,
      {
        restApiName: `${props.stageName} Weather Rest Api`,
        description: "This service saves weather data.",
      } as apigw.RestApiProps
    );

    /*********************************************************
     * Lambda function that performs the CREATE operation
     *********************************************************/
    // NodejsFunction bundles the TypeScript with esbuild (tsconfig has noEmit,
    // so lambda.Code.fromAsset("src") would upload .ts files Lambda can't run).
    const createWeatherLambda: NodejsFunction = new NodejsFunction(
      this,
      "CreateWeatherLambdaFunction",
      {
        functionName: `${props.stageName}-cdk-typescript-create`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, "../src/createWeather.ts"),
        handler: "lambdaHandler",
        environment: {
          TABLE_NAME: table.tableName,
          STAGE_NAME: props.stageName,
        },
      }
    );

    /*******************************************************************
     * Give the lambda function permission to write to the table.
     ********************************************************************/
    table.grantWriteData(createWeatherLambda);

    /*********************************************************
     * API endpoint: POST /create-weather -> createWeatherLambda
     *********************************************************/
    weatherApi.root
      .addResource("create-weather")
      .addMethod("POST", new apigw.LambdaIntegration(createWeatherLambda));
  }
}
