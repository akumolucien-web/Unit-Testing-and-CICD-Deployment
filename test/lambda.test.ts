import { lambdaHandler as createWeather } from "../src/createWeather";
import { lambdaHandler as getWeather } from "../src/getWeather";
import { lambdaHandler as deleteWeather } from "../src/deleteWeather";
import { lambdaHandler as updateWeather } from "../src/updateWeather";
import { lambdaHandler as listWeathers } from "../src/listWeathers";
import { client } from "../src/shared";

// Replace the real DynamoDB client so these tests run offline, with no AWS login.
jest.mock("../src/shared", () => ({
  ...jest.requireActual("../src/shared"),
  client: { send: jest.fn() },
}));
const send = client.send as unknown as jest.Mock;

beforeEach(() => send.mockReset());

const shape = { body: expect.any(String), statusCode: expect.any(Number) };

describe("create weather", () => {
  test("creates an item and returns 201", async () => {
    send.mockResolvedValue({});
    const result = await createWeather({
      body: JSON.stringify({ weather: "hot", town: "Douala" }),
    });
    expect(result).toMatchObject(shape);
    expect(result.statusCode).toBe(201);
    expect(JSON.parse(result.body)).toMatchObject({
      weather: "hot",
      town: "Douala",
      id: expect.any(String),
    });
    expect(send).toHaveBeenCalledTimes(1);
  });

  test("returns 400 when a field is missing", async () => {
    const result = await createWeather({ body: JSON.stringify({ town: "x" }) });
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  test("returns 500 when DynamoDB fails", async () => {
    send.mockRejectedValue(new Error("boom"));
    const result = await createWeather({
      body: JSON.stringify({ weather: "hot", town: "Douala" }),
    });
    expect(result).toMatchObject(shape);
    expect(result.statusCode).toBe(500);
  });
});

describe("get weather", () => {
  test("returns the item", async () => {
    send.mockResolvedValue({ Item: { id: "1", weather: "hot", town: "Douala" } });
    const result = await getWeather({ pathParameters: { id: "1" } });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body).town).toBe("Douala");
  });

  test("returns 404 when it does not exist", async () => {
    send.mockResolvedValue({});
    const result = await getWeather({ pathParameters: { id: "nope" } });
    expect(result.statusCode).toBe(404);
  });

  test("returns 400 without an id", async () => {
    const result = await getWeather({});
    expect(result.statusCode).toBe(400);
  });
});

describe("update weather", () => {
  test("replaces the item and returns 200", async () => {
    send.mockResolvedValue({});
    const result = await updateWeather({
      pathParameters: { id: "1" },
      body: JSON.stringify({ weather: "cold", town: "Douala" }),
    });
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      id: "1",
      weather: "cold",
      town: "Douala",
    });
  });

  test("returns 404 when the item does not exist", async () => {
    const err = new Error("condition failed");
    err.name = "ConditionalCheckFailedException";
    send.mockRejectedValue(err);
    const result = await updateWeather({
      pathParameters: { id: "nope" },
      body: JSON.stringify({ weather: "cold", town: "Douala" }),
    });
    expect(result.statusCode).toBe(404);
  });

  test("returns 400 when fields are missing", async () => {
    const result = await updateWeather({
      pathParameters: { id: "1" },
      body: "{}",
    });
    expect(result.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });
});

describe("delete weather", () => {
  test("deletes and returns the old item", async () => {
    send.mockResolvedValue({ Attributes: { id: "1", weather: "hot", town: "x" } });
    const result = await deleteWeather({ pathParameters: { id: "1" } });
    expect(result.statusCode).toBe(200);
  });

  test("returns 404 when it never existed", async () => {
    send.mockResolvedValue({});
    const result = await deleteWeather({ pathParameters: { id: "nope" } });
    expect(result.statusCode).toBe(404);
  });

  test("returns 400 without an id", async () => {
    const result = await deleteWeather({});
    expect(result.statusCode).toBe(400);
  });
});

describe("list weathers", () => {
  test("returns all items", async () => {
    send.mockResolvedValue({ Items: [{ id: "1" }, { id: "2" }] });
    const result = await listWeathers();
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toHaveLength(2);
  });

  test("returns an empty list for an empty table", async () => {
    send.mockResolvedValue({});
    const result = await listWeathers();
    expect(JSON.parse(result.body)).toEqual([]);
  });
});
