"use strict";
import request from "supertest";
import app from "../../app";
import User from "../../models/user";
import Farm from "../../models/farm";
import {
  commonBeforeAll, commonBeforeEach,
  commonAfterEach, commonAfterAll, farmIDs,
  u1Token, u2Token, u3Token, locationID
} from "./_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const usr1Token = `Bearer ${u1Token}`;
const usr2Token = `Bearer ${u2Token}`;
const usr3Token = `Bearer ${u3Token}`;

describe("GET /farms/:farmID", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/farms/${farmIDs[0]}`});
  
  it("retrieves farm data", async () => {
    const resp = await request(app).get(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      farm: {
        id: farmIDs[0],
        irrigationLVL: 0,
        lastCheckedAt: expect.any(String),
        length: 3,
        width: 3,
        owner: "usr1",
        locationName: "Las Vegas",
        locationRegion: "Nevada",
        locationCountry: "United States",
        crops : [
          {
            berryType: "cheri",
            curGrowthStage: 0,
            health: 100,
            id: expect.any(Number),
            moisture: 0,
            plantedAt: expect.any(String),
            x: 0,
            y: 0
          }
        ]
      }
    });
  });

  it("responds 211 if time for sync", async () => {
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(Date.now() + 3600000));
    const resp = await request(app).get(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(211);
    expect("farm" in resp.body).toBeFalsy();
    jest.useRealTimers();
  });

  it("responds 400 if non-numeric farmID param", async () => {
    const resp = await request(app).get("/farms/nadfbn").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).get(endpoint);
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 404 if no such farm", async () => {
    const resp = await request(app).get("/farms/-1").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /farms", () => {
  it("works if admin", async () => {
    let resp = await request(app).post('/farms')
    .send({ owner: "usr1", locationID })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      message: "created",
      farm: {
        id: expect.any(Number),
        length: 3,
        width: 3,
        irrigationLVL: 0,
        lastCheckedAt: expect.any(String),
        locationID: expect.any(Number),
        owner: "usr1"
      }
    });

    resp = await request(app).post('/farms')
    .send({ owner: "usr1", locationID, length: 5, width: 5, irrigationLVL: 3 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      message: "created",
      farm: {
        id: expect.any(Number),
        length: 5,
        width: 5,
        irrigationLVL: 3,
        lastCheckedAt: expect.any(String),
        locationID: expect.any(Number),
        owner: "usr1",
      }
    });
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).post('/farms').set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    const resp = await request(app).post('/farms')
    .send({ owner: "usr1", locationID, length: 100, width: 100 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post('/farms').send({ owner: "usr3", locationID });
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 forbidden if not admin", async () => {
    const resp = await request(app).post('/farms')
    .send({ owner: "usr1", locationID })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });
});

describe("POST /farms/buy", () => {
  beforeAll(async () => {
    await User.update("usr1", { funds: 9999 });
  });

  it("works", async () => {
    const resp = await request(app).post("/farms/buy").send({ locationID }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(201);
  });

  it("responds 400 if not enough funds", async () => {
    const resp = await request(app).post("/farms/buy").send({ locationID }).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if maxed out farms", async () => {
    await Farm.create({owner: "usr1", locationID})
    await Farm.create({owner: "usr1", locationID})
    const resp = await request(app).post("/farms/buy").send({ locationID }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).post("/farms/buy").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad location ID", async () => {
    const resp = await request(app).post("/farms/buy")
    .send({ locationID: 0 }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  })

  it("responds 400 if invalid payload", async () => {
    const resp = await request(app).post("/farms/buy").send({ location: 1 }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post("/farms/buy").send({ locationID });
    expect(resp.statusCode).toEqual(401);
  });
});

describe("POST /farms/:farmID/upgrade", () => {
  let endpoint:string;
  beforeAll(async () => {
    await User.update("usr1", { funds: 9999 });
    endpoint = `/farms/${farmIDs[0]}/upgrade`;
  });

  it("works with farm length", async () => {
    const resp = await request(app).post(endpoint)
    .send({ type: "length" }).set("authorization", usr1Token);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "upgraded",
      farm: {
        id: farmIDs[0],
        length: 4,
        width: 3,
        irrigationLVL: 0,
        owner: "usr1", 
        locationID: expect.any(Number),
        lastCheckedAt: expect.any(String)
      }
    });
  });

  it("works with farm width", async () => {
    const resp = await request(app).post(endpoint)
    .send({ type: "width" }).set("authorization", usr1Token);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "upgraded",
      farm: {
        id: farmIDs[0],
        length: 3,
        width: 4,
        irrigationLVL: 0,
        owner: "usr1", 
        locationID: expect.any(Number),
        lastCheckedAt: expect.any(String)
      }
    });
  });

  it("works with farm irrig", async () => {
    const resp = await request(app).post(endpoint)
    .send({ type: "irrigation" }).set("authorization", usr1Token);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "upgraded",
      farm: {
        id: farmIDs[0],
        length: 3,
        width: 3,
        irrigationLVL: 1,
        owner: "usr1", 
        locationID: expect.any(Number),
        lastCheckedAt: expect.any(String)
      }
    });
  });

  it("responds 400 if non-numeric farmID param", async () => {
    const resp = await request(app).post("/farms/nadfbn/upgrade")
    .send({ type: "irrigation" }).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    const resp = await request(app).post(endpoint)
    .send({ type: "coolness" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).post(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if not enough funds", async () => {
    const endpoint = `/farms/${farmIDs[1]}/upgrade`;
    let resp = await request(app).post(endpoint).send({ type: "length" }).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(400);
    resp = await request(app).post(endpoint).send({ type: "width" }).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(400);
    resp = await request(app).post(endpoint).send({ type: "irrigation" }).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post(endpoint).send({ type: "length" });
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if user does not own farm", async () => {
    const endpoint = `/farms/${farmIDs[1]}/upgrade`;
    const resp = await request(app).post(endpoint).send({ type: "length" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });
  
  it("responds 404 if no farm of given ID", async () => {
    const endpoint = "/farms/-1/upgrade";
    const resp = await request(app).post(endpoint).send({ type: "length" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /farms/:farmID/sync", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/farms/${farmIDs[0]}/sync` });
  
  it("works", async () => {
    const oldFarm = await Farm.get(farmIDs[0]);
    jest.useFakeTimers("modern");
    jest.setSystemTime(new Date(Date.now() + 3600000));
    const resp = await request(app).post(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "updated",
      farm: {
        crops: [
          {
            berryType: 'cheri', curGrowthStage: 0, health: 100, 
            id: expect.any(Number), moisture: expect.any(Number),
            plantedAt: expect.any(String), x: 0, y: 0
          }
        ],
        id: farmIDs[0],
        irrigationLVL: 0,
        lastCheckedAt: expect.any(String),
        length: 3,
        locationCountry: 'United States',
        locationName: 'Las Vegas',
        locationRegion: 'Nevada',
        owner: 'usr1',
        width: 3
      }
    });
    expect(resp.body.farm.lastCheckedAt).not.toEqual(oldFarm.lastCheckedAt);
    expect(resp.body.farm.crops[0].moisture).not.toEqual(oldFarm.crops[0].moisture);
    jest.useRealTimers();
  });

  it("responds 400 if non-numeric farmID param", async () => {
    const resp = await request(app).post("/farms/nadfbn/sync").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post(endpoint);
    expect(resp.statusCode).toEqual(401);
  });
  
  it("responds 403 if not farm owner", async () => {
    const resp = await request(app).post(endpoint).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if invalid farm id", async () => {
    const endpoint = "/farms/-1/sync";
    const resp = await request(app).post(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("PATCH /farms/:farmID", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/farms/${farmIDs[0]}` });

  it("works for admin", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ length: 5, width: 6, irrigationLVL: 1 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "updated",
      farm: {
        id: farmIDs[0],
        irrigationLVL: 1,
        length: 5,
        width: 6,
        lastCheckedAt: expect.any(String),
        owner: "usr1",
        locationID
      }
    });
  });

  it("responds 400 if non-numeric farmID param", async () => {
    const resp = await request(app).patch("/farms/nadfbn")
    .send({ length: 4 }).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ lastCheckedAt: "1999-12-31 00:00:00 "})
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).patch(endpoint)
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ length: 5, width: 5 });
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not admin", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ length: 5, width: 5 })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such farm", async () => {
    const resp = await request(app).patch("/farms/-1")
    .send({ length: 5, width: 5 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("DELETE /farms/:farmID", () => {
  let endpoint:string;
  beforeAll( () => { endpoint = `/farms/${farmIDs[0]}` });

  it("works for owner", async () => {
    const resp = await request(app).delete(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      deleted: farmIDs[0]
    });
  });

  it("works for admin", async () => {
    const resp = await request(app).delete(endpoint).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      deleted: farmIDs[0]
    });
  });

  it("responds 400 if non-numeric farmID param", async () => {
    const resp = await request(app).delete("/farms/nadfbn").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).delete(endpoint);
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not owner of farm", async () => {
    const resp = await request(app).delete(endpoint).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such farm", async () => {
    const endpoint = "/farms/-1"
    const resp = await request(app).delete(endpoint).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});