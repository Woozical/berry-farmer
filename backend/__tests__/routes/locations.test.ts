"use strict";
import request from "supertest";
import db from "../../db";
import app from "../../app";
import {
  commonBeforeAll, commonBeforeEach,
  commonAfterEach, commonAfterAll,
  u1Token, u3Token, locationID
} from "./_testCommon";
import GeoProfile from "../../models/geoProfiles";
import axios from "axios";
import HistoryAPIResponse from "../resources/weather-history-response.json";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const usr1Token = `Bearer ${u1Token}`;
const usr3Token = `Bearer ${u3Token}`;

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("GET /locations/:locationID", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/locations/${locationID}`});
  
  it("works", async () => {
    const resp = await request(app).get(endpoint);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "ok", location: {
      id: locationID,
      name: "Las Vegas",
      region: "Nevada",
      country: "United States"
    }});
  });

  it("responds 400 if non-numeric locationID parameter", async () => {
    const resp = await request(app).get("/locations/houston");
    expect(resp.statusCode).toEqual(400);
  })
  
  it("responds 404 if no such location", async () => {
    const resp = await request(app).get("/locations/-1");
    expect(resp.statusCode).toEqual(404);
  });
});

describe("PATCH /locations/:locationID", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/locations/${locationID}`});

  it("admin: works", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ name: "newName", region: "newRegion" })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "updated", location: {
      id: locationID, name: "newName", region: "newRegion", country: "United States", tzOffset: "0"
    }});
  });

  it("responds 400 on no payload", async () => {
    const resp = await request(app).patch(endpoint)
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 on non-numeric locationID param", async () => {
    const resp = await request(app).patch("/locations/houston")
    .send({ name: "newName", region: "newRegion "})
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 on bad payload", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ id: 20 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ country: "newCountry "});
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not admin", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ name: "nuName" })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such location", async () => {
    const resp = await request(app).patch("/locations/-1")
    .send({ name: "nuName" })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("DELETE /locations/:locationID", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/locations/${locationID}`});

  it("admin: works", async () => {
    const q = await db.query("INSERT INTO geo_profiles (name, region, country) VALUES ('del1', 'del2', 'del3') RETURNING id");
    const endpoint = `/locations/${q.rows[0].id}`;
    const resp = await request(app).delete(endpoint)
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "ok", deleted: q.rows[0].id });
  });

  it("responds 400 on non-numeric locationID parameter", async () => {
    const resp = await request(app).delete("/locations/houston")
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if farms use location", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ id: 20 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).patch(endpoint)
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not admin", async () => {
    const resp = await request(app).delete(endpoint)
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such location", async () => {
    const resp = await request(app).delete("/locations/-1")
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /locations/:locationID", () => {
  it("works", async () => {
    mockedAxios.get.mockResolvedValue({ data: HistoryAPIResponse });
    const resp = await request(app).post("/locations")
    .send({ search: "london" })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ message: "created", location: {
      id: expect.any(Number), name: "London", region: "City of London, Greater London", country: "United Kingdom"
    }});
  });

  it("works: temp API failure", async () => {
    mockedAxios.get.mockRejectedValueOnce({ response: { message: "server overload!!!", status: 500 } });
    mockedAxios.get.mockResolvedValue({ data: HistoryAPIResponse });
    const resp = await request(app).post("/locations")
    .send({ search: "london" })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({ message: "created", location: {
      id: expect.any(Number), name: "London", region: "City of London, Greater London", country: "United Kingdom"
    }});
  });

  it("responds 400 if location already exists", async () => {
    mockedAxios.get.mockResolvedValue({ data: HistoryAPIResponse });
    let resp = await request(app).post("/locations").send({ search: "london" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(201);
    resp = await request(app).post("/locations").send({ search: "london" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    mockedAxios.get.mockResolvedValue({ data: HistoryAPIResponse });
    const resp = await request(app).post("/locations")
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    mockedAxios.get.mockResolvedValue({ data: HistoryAPIResponse });
    const resp = await request(app).post("/locations")
    .send({ search: "london "});
    expect(resp.statusCode).toEqual(401);
  });

  it("pushes API 400 responses", async () => {
    mockedAxios.get.mockRejectedValue({ response: {message: "not found",  status: 404 } });
    const resp = await request(app).post("/locations")
    .send({ search: "london "})
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });

  it("responds 500 if no connection to API", async () => {
    mockedAxios.get.mockRejectedValue({ msg: "Could not connect!" });
    const resp = await request(app).post("/locations")
    .send({ search: "london "})
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(500);
  });

  afterEach( () => {
    jest.clearAllMocks();
  });
});

describe("GET /locations", () => {
  beforeAll( async () => {
    await db.query(
      `INSERT INTO geo_profiles (name, region, country)
       VALUES ('a00', 'b00', 'c0'),
              ('a01', 'b01', 'c0'),
              ('a02', 'b02', 'c0'),
              ('a03', 'b03', 'c0'),
              ('a04', 'b04', 'c0'),
              ('a05', 'b05', 'c0'),
              ('a06', 'b06', 'c0'),
              ('a07', 'b07', 'c0'),
              ('a08', 'b08', 'c0'),
              ('a09', 'b09', 'c0'),
              ('a10', 'b10', 'c0'),
              ('a11', 'b11', 'c0'),
              ('a12', 'b12', 'c0'),
              ('a13', 'b13', 'c0'),
              ('a14', 'b14', 'c0'),
              ('a15', 'b14', 'c0'),
              ('a16', 'b14', 'c0'),
              ('a17', 'b14', 'c0'),
              ('a18', 'b14', 'c0'),
              ('a19', 'b14', 'c0'),
              ('a20', 'b14', 'c0'),
              ('a21', 'b14', 'c0')`
    );
  });

  it("works", async () => {
    const resp = await request(app).get("/locations");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.page).toEqual(0);
    expect(resp.body.locations.length).toEqual(GeoProfile.PAGE_LIMIT);
  });

  it("works with paging", async () => {
    const resp = await request(app).get("/locations").query({ page: 1 });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "ok", page: 1, locations: [
      { id: expect.any(Number), name: "a19", region: "b14", country: "c0" },
      { id: expect.any(Number), name: "a20", region: "b14", country: "c0" },
      { id: expect.any(Number), name: "a21", region: "b14", country: "c0" }
    ]});
  });

  it("works with filtering", async () => {
    const resp = await request(app).get("/locations").query({ name: "a2", region: "b14" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "ok", page: 0, locations: [
      { id: expect.any(Number), name: "a20", region: "b14", country: "c0" },
      { id: expect.any(Number), name: "a21", region: "b14", country: "c0" }
    ]});
  });

  it("works with paging and filtering", async () => {
    const resp = await request(app).get("/locations").query({ name: "a1", page: 1 });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "ok", page: 1, locations: []});
  });

  it("ignores unwanted query string parameters", async () => {
    const resp = await request(app).get("/locations").query({ name: "a", page: 1, wrench: "in the works" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ message: "ok", page: 1, locations: [
      { id: expect.any(Number), name: "a19", region: "b14", country: "c0" },
      { id: expect.any(Number), name: "a20", region: "b14", country: "c0" },
      { id: expect.any(Number), name: "a21", region: "b14", country: "c0" }
    ]});
  });
});