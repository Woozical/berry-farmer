"use strict";
import request from "supertest";
import app from "../../app";
import User from "../../models/user";
import {
  commonBeforeAll, commonBeforeEach,
  commonAfterEach, commonAfterAll,
  u1Token, u2Token
} from "./_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const usr1Token = `Bearer ${u1Token}`;
const usr2Token = `Bearer ${u2Token}`;

describe("GET /berries/:berryType", () => {
  it("works", async () => {
    const resp = await request(app).get("/berries/cheri");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      berry : {
        name: "cheri",
        dryRate: 10,
        maxHarvest: 5,
        size: 20,
        growthTime: 3,
        idealCloud: 15,
        idealTemp: 90,
        pokeType: "fire",
        pokePower: 60,
        price: expect.any(Number)
      }
    });
  });

  it("responds 404 if no such berry", async () => {
    const resp = await request(app).get("/berries/idontexist");
    expect(resp.statusCode).toEqual(404);
  });
});

describe("GET /berries/prices", () => {
  it("works", async () => {
    const resp = await request(app).get("/berries/prices");
    expect(resp.statusCode).toEqual(200);
    expect(resp.body.message).toEqual("ok");
    for (let berry of Object.keys(resp.body)){
      expect(resp.body.prices[berry]).toEqual(app.locals.marketPrices.get(berry));
    }
  });
});

describe("POST /berries/sell", () => {
  it("works", async () => {
    await User.addBerry("usr1", "cheri", 3);
    const resp = await request(app).post("/berries/sell")
    .send({ berryType: "cheri", amount: 3 })
    .set("authorization", usr1Token);
    expect(resp.status).toEqual(200);
    const user = await User.get("usr1");
    expect(user.funds).not.toEqual(0);
    expect(user.inventory.cheri).toEqual(1);
  });

  it("responds 400 if insufficient berries in user inventory", async () => {
    let resp = await request(app).post("/berries/sell").send({ berryType: "pecha", amount: 1}).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    resp = await request(app).post("/berries/sell").send({ berryType: "cheri", amount: 5}).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).post("/berries/sell").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    /** Missing field: berryType */
    let resp = await request(app).post("/berries/sell").send({ amount: 1}).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** Missing field: amount */
    resp = await request(app).post("/berries/sell").send({ berryType: "cheri" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** No such berryType */
    resp = await request(app).post("/berries/sell").send({ berryType: "idontexist", amount: 1}).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post("/berries/sell").send({ berryType: "cheri", amount: 1});
    expect(resp.statusCode).toEqual(401);
  });
});

describe("POST /berries/buy", () => {
  it("works", async () => {
      await User.update("usr1", { funds: 9999 });
      const resp = await request(app).post("/berries/buy")
      .send({ berryType: "chesto", amount: 2 })
      .set("authorization", usr1Token);
      expect(resp.statusCode).toEqual(201);
      const user = await User.get("usr1");
      expect(user.funds).not.toEqual(9999);
      expect(user.inventory.chesto).toEqual(2);
  });

  it("responds 400 if insufficient funds", async () => {
    const resp = await request(app).post("/berries/buy")
    .send({ berryType: "pecha", amount: 4})
    .set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if no payload", async () => {
    const resp = await request(app).post("/berries/buy")
    .set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 400 if bad payload", async () => {
    /** Missing field: berryType */
    let resp = await request(app).post("/berries/buy").send({ amount: 1}).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** Missing field: amount */
    resp = await request(app).post("/berries/buy").send({ berryType: "cheri" }).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
    /** No such berryType */
    resp = await request(app).post("/berries/buy").send({ berryType: "idontexist", amount: 1}).set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(400);
  });

  it("responds 401 if not logged in", async () => {
    const resp = await request(app).post("/berries/buy").send({ berryType: "cheri", amount: 1});
    expect(resp.statusCode).toEqual(401);
  });
});