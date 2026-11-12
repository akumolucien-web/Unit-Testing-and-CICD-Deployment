import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { client, respond, WeatherEvent } from "./shared";

// PUT semantics: replaces the whole item, so weather and town are both required.
export const lambdaHandler = async (event: WeatherEvent) => {
  try {
    const id = event.pathParameters?.id;
    const { weather, town } = JSON.parse(event.body ?? "{}");
    if (!id || !weather || !town) {
      return respond(400, { message: "id, weather and town are required" });
    }

    const item = { id, weather, town };
    await client.send(
      new PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item,
        // Update only: don't silently create an item that doesn't exist.
        ConditionExpression: "attribute_exists(id)",
      })
    );
    return respond(200, item);
  } catch (err) {
    if ((err as Error).name === "ConditionalCheckFailedException") {
      return respond(404, { message: "not found" });
    }
    return respond(500, { message: (err as Error).message });
  }
};
