import { randomUUID } from "crypto";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { client, respond, WeatherEvent } from "./shared";

export const lambdaHandler = async (event: WeatherEvent) => {
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
