import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const respond = (statusCode: number, message: unknown) => ({
  statusCode,
  body: JSON.stringify(message),
});

// Minimal shape of the API Gateway event the handlers read.
export interface WeatherEvent {
  body?: string | null;
  pathParameters?: { id?: string } | null;
}
