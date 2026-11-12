import { DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { client, respond, WeatherEvent } from "./shared";

export const lambdaHandler = async (event: WeatherEvent) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) return respond(400, { message: "id is required" });

    const { Attributes } = await client.send(
      new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: { id },
        ReturnValues: "ALL_OLD", // lets us tell "deleted" from "never existed"
      })
    );
    return Attributes
      ? respond(200, { message: "deleted", item: Attributes })
      : respond(404, { message: "not found" });
  } catch (err) {
    return respond(500, { message: (err as Error).message });
  }
};
