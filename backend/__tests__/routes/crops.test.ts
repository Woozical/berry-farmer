"use strict";
import request from "supertest";
import app from "../../app";
import Crop from "../../models/crop";
import User from "../../models/user";
import {
  commonBeforeAll, commonBeforeEach,
  commonAfterEach, commonAfterAll,
  u1Token, u2Token, u3Token, cropIDs, farmIDs
} from "./_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const usr1Token = `Bearer ${u1Token}`;
const usr2Token = `Bearer ${u2Token}`;
const usr3Token = `Bearer ${u3Token}`;

describe("GET /crops/:cropID", () => {
  let endpoint:string;
  beforeAll(() => { endpoint = `/crops/${cropIDs[0]}`});

  it("works", async () => {
    const resp = await request(app).get(endpoint);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      crop: {
        id: expect.any(Number),
        farmID: expect.any(Number),
        curGrowthStage: 0,
        plantedAt: expect.any(String),
        x: 0,
        y: 0,
        health: 100,
        moisture: 0,
        berry: {
          dryRate: 10,
          growthTime: 3,
          idealCloud: 15,
          idealTemp: 90,
          maxHarvest: 5,
          pokePower: 60,
          pokeType: 'fire',
          size: 20,
          type: "cheri"
        }
      }
    })
  });

  it("responds 404 if no such crop", async () => {
    const resp = await request(app).get("/crops/-1");
    expect(resp.statusCode).toEqual(404);
  });

  it("responds 400 if non-numeric cropID", async () => {
    const resp = await request(app).get("/crops/asdf");
    expect(resp.statusCode).toEqual(400);
  });
});

describe("PATCH /crops/:cropID", () => {
  let endpoint:string;
  beforeAll(() => { endpoint = `/crops/${cropIDs[0]}`});

  it("works", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ moisture: 44, curGrowthStage: 2 }).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "updated",
      crop: {
        berryType: "cheri",
        farmID: expect.any(Number),
        health: 100,
        id: expect.any(Number),
        curGrowthStage: 2,
        moisture: 44,
        plantedAt: expect.any(String),
        x: 0,
        y: 0
      }
    });
  });

  it("responds 400 if non-numeric cropID", async () => {
    const resp = await request(app).patch("/crops/flarnanej")
    .send({ moisture: 44, curGrowthStage: 2 }).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).patch(endpoint)
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ owner: "usr3", plantedAt: "1999-12-21" }).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ moisture: 44, curGrowthStage: 2 });
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not admin", async () => {
    const resp = await request(app).patch(endpoint)
    .send({ moisture: 44, curGrowthStage: 2 }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such crop with id", async () => {
    const resp = await request(app).patch("/crops/-1")
    .send({ moisture: 44, curGrowthStage: 2 }).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });  
});

describe("POST /crops/:cropID/harvest", () => {
  let endpoint:string;
  beforeAll(() => { endpoint = `/crops/${cropIDs[0]}/harvest`});
  
  it("works", async () => {
    await Crop.update(cropIDs[0], { curGrowthStage: 4 });
    const resp = await request(app).post(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.harvest.amount).toEqual(5);
  });

  it("responds 400 if crop not ready for harvest", async () => {
    const resp = await request(app).post(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if non-numeric cropID", async () => {
    const resp = await request(app).post("/crops/inseugnes/harvest");
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post(endpoint);
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not owner of crop", async () => {
    const resp = await request(app).post(endpoint).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such crop", async () => {
    // With auth bypass by admin
    let resp = await request(app).post("/crops/-1/harvest").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
    // Without
    resp = await request(app).post("/crops/-1/harvest").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("DELETE /crops/:cropID", () => {
  let endpoint:string;
  beforeAll(()=>{ endpoint=`/crops/${cropIDs[0]}` });

  it("works: crop owner", async () => {
    const resp = await request(app).delete(endpoint).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.deleted).toEqual(cropIDs[0]);
  });

  it("works: admin", async () => {
    const resp = await request(app).delete(endpoint).set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.deleted).toEqual(cropIDs[0]);
  });

  it("responds 400 if non-numeric cropID", async () => {
    const resp = await request(app).delete("/crops/nairnbuai").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).delete(endpoint);
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not crop owner", async () => {
    const resp = await request(app).delete(endpoint).set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if no such crop", async () => {
    const resp = await request(app).delete("/crops/-1").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /crops", () => {
  it("works for admin", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "chesto", x: 2, y: 2, curGrowthStage: 3 })
    .set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      message: "created",
      crop: {
        id: expect.any(Number),
        berryType: "chesto",
        farmID: farmIDs[0],
        x: 2,
        y: 2,
        plantedAt: expect.any(String),
        curGrowthStage: 3,
        health: 100,
        moisture: 0
      }
    });
  });

  it("works for farm owner", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "cheri", x: 2, y:2 })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      message: "created",
      crop: {
        id: expect.any(Number),
        berryType: "cheri",
        farmID: farmIDs[0],
        x: 2,
        y: 2,
        plantedAt: expect.any(String),
        curGrowthStage: 0,
        health: 100,
        moisture: 0
      }
    });
  });
  it("responds 400 if non-admin lacks berry to plant", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "pecha", x: 2, y:2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).post("/crops")
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    /** Missing field */
    let resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "cheri", y:2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** Duplicate crop coordinates */
    // resp = await request(app).post("/crops")
    // .send({ farmID: farmIDs[0], berryType: "cheri", y:0, x:0  })
    // .set("authorization", usr1Token);
    // expect(resp.statusCode).toEqual(400);
    /** Non-existant berry type */
    resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "idontexist", x:0, y:2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** Extra fields */
    resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "cheri", plantedAt: "1999-12-21", x:2, y:2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** Non-numeric farm ID */
    resp = await request(app).post("/crops")
    .send({ farmID: "my farm", berryType: "cheri", x:0, y:2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "cheri", x: 2, y:2  })
    expect(resp.statusCode).toEqual(401);
  });

  it("responds 403 if not farm owner", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "chesto", x: 2, y:2  })
    .set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 403 if non-admin tries to create with custom curGrowthStage", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: farmIDs[0], berryType: "cheri", x: 2, y:2, curGrowthStage: 2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("responds 404 if invalid farm ID in payload", async () => {
    const resp = await request(app).post("/crops")
    .send({ farmID: -1, berryType: "cheri", x: 2, y:2  })
    .set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("POST /farms/:farmID/water", () => {

});