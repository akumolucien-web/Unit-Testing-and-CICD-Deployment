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
     * One Lambda per CRUDL operation, all bundled from src/.
     * NodejsFunction bundles the TypeScript with esbuild (tsconfig has noEmit,
     * so lambda.Code.fromAsset("src") would upload .ts files Lambda can't run).
     *********************************************************/
    const weatherLambda = (
      id: string,
      operation: string,
      entryFile: string
    ): NodejsFunction =>
      new NodejsFunction(this, id, {
        functionName: `${props.stageName}-cdk-typescript-${operation}`,
        runtime: lambda.Runtime.NODEJS_22_X,
        entry: path.join(__dirname, `../src/${entryFile}.ts`),
        handler: "lambdaHandler",
        environment: {
          TABLE_NAME: table.tableName,
          STAGE_NAME: props.stageName,
        },
      });

    const createWeatherLambda = weatherLambda(
      "CreateWeatherLambdaFunction",
      "create",
      "createWeather"
    );
    const getWeatherLambda = weatherLambda(
      "GetWeatherLambdaFunction",
      "get",
      "getWeather"
    );
    const updateWeatherLambda = weatherLambda(
      "UpdateWeatherLambdaFunction",
      "update",
      "updateWeather"
    );
    const deleteWeatherLambda = weatherLambda(
      "DeleteWeatherLambdaFunction",
      "delete",
      "deleteWeather"
    );
    const listWeathersLambda = weatherLambda(
      "ListWeathersLambdaFunction",
      "list",
      "listWeathers"
    );

    /*******************************************************************
     * Least privilege: readers read, writers write.
     ********************************************************************/
    table.grantWriteData(createWeatherLambda);
    table.grantReadData(getWeatherLambda);
    table.grantWriteData(updateWeatherLambda);
    table.grantWriteData(deleteWeatherLambda);
    table.grantReadData(listWeathersLambda);

    /*********************************************************
     * API endpoints
     *   POST   /create-weather
     *   GET    /get-weather/{id}
     *   PUT    /update-weather/{id}
     *   DELETE /delete-weather/{id}
     *   GET    /list-weathers
     *********************************************************/
    weatherApi.root
      .addResource("create-weather")
      .addMethod("POST", new apigw.LambdaIntegration(createWeatherLambda));

    weatherApi.root
      .addResource("get-weather")
      .addResource("{id}")
      .addMethod("GET", new apigw.LambdaIntegration(getWeatherLambda));

    weatherApi.root
      .addResource("update-weather")
      .addResource("{id}")
      .addMethod("PUT", new apigw.LambdaIntegration(updateWeatherLambda));

    weatherApi.root
      .addResource("delete-weather")
      .addResource("{id}")
      .addMethod("DELETE", new apigw.LambdaIntegration(deleteWeatherLambda));

    weatherApi.root
      .addResource("list-weathers")
      .addMethod("GET", new apigw.LambdaIntegration(listWeathersLambda));
  }
}
