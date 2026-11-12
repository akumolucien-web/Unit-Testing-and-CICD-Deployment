import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { client, respond, WeatherEvent } from "./shared";

export const lambdaHandler = async (event: WeatherEvent) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return respond(400, { message: "id is required" });

    const { Item } = await client.send(
      new GetCommand({ TableName: process.env.TABLE_NAME, Key: { id } })
    );
    return Item ? respond(200, Item) : respond(404, { message: "not found" });
  } catch (err) {
    return respond(500, { message: (err as Error).message });
  }
};
