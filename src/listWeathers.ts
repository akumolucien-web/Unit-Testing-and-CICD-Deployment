import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { client, respond } from "./shared";

// ponytail: single Scan returns at most 1 MB; add LastEvaluatedKey paging if the table grows.
export const lambdaHandler = async (_event?: unknown) => {
  try {
    const { Items } = await client.send(
      new ScanCommand({ TableName: process.env.TABLE_NAME })
    );
    return respond(200, Items ?? []);
  } catch (err) {
    return respond(500, { message: (err as Error).message });
  }
};
