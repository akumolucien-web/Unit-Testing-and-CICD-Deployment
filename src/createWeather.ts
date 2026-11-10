import { randomUUID } from "crypto";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// Minimal shape of the API Gateway event this handler reads.
interface CreateWeatherEvent {
  body?: string | null;
}

const respond = (statusCode: number, message: unknown) => ({
  statusCode,
  body: JSON.stringify(message),
});

export const lambdaHandler = async (event: CreateWeatherEvent) => {
  try {
    const { weather, town } = JSON.parse(event.body ?? "{}");
    if (!weather || !town) {
      return respond(400, { message: "weather and town are required" });
    }

    const item = { id: randomUUID(), weather, town };
    await client.send(
      new PutCommand({ TableName: process.env.TABLE_NAME, Item: item })
    );
    return respond(201, item);
  } catch (err) {
    // Covers bad JSON and DynamoDB errors (e.g. no TABLE_NAME when run locally).
    return respond(500, { message: (err as Error).message });
  }
};
