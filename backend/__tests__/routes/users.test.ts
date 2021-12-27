"use strict";
import request from "supertest";
import app from "../../app";
import {
  commonBeforeAll, commonBeforeEach,
  commonAfterEach, commonAfterAll,
  u1Token, u2Token, u3Token
} from "./_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

const usr1Token = `Bearer ${u1Token}`;
const usr2Token = `Bearer ${u2Token}`;
const usr3Token = `Bearer ${u3Token}`;

describe("GET /users/:username", () => {
  it("provides full user info if sameuser", async () => {
    const resp = await request(app).get("/users/usr1").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      user: {
        username: "usr1",
        email: "user1@user.com",
        funds: 0,
        farmCount: 1
      }
    });
  });

  it("provides full user info if admin", async () => {
    const resp = await request(app).get("/users/usr1").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      user: {
        username: "usr1",
        email: "user1@user.com",
        funds: 0,
        farmCount: 1
      }
    });
  });

  it("hides sensitive information if not sameuser", async () => {
    const resp = await request(app).get("/users/usr1").set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      user: {
        username: "usr1",
        funds: 0,
        farmCount: 1
      }
    });
  });

  it("responds 401 Unauth if not logged in", async () => {
    const resp = await request(app).get("/users/usr1");
    expect(resp.statusCode).toEqual(401);
  });
  
  it("responds 404 notfound if no such user", async () => {
    const resp = await request(app).get("/users/idontexist").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("DELETE /users/:username", () => {
  it("works for same user", async () => {
    const resp = await request(app).delete("/users/usr1").set("authorization", usr1Token);
    expect(resp.statusCode).toEqual(200);
  });

  it("works for admin", async () => {
    const resp = await request(app).delete("/users/usr1").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
  });

  it("throws 401 unauthorized if not logged in", async () => {
    const resp = await request(app).delete("/users/usr1");
    expect(resp.statusCode).toEqual(401);
  });

  it("throws 403 forbidden if not same user", async () => {
    const resp = await request(app).delete("/users/usr1").set("authorization", usr2Token);
    expect(resp.statusCode).toEqual(403);
  });

  it("throws 404 not found if invalid username", async () => {
    const resp = await request(app).delete("/users/idontexist").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("GET /users/:username/farms", () => {
  it("works if logged in", async () => {
    let resp = await request(app).get("/users/usr2/farms").set("authorization", usr1Token);

    const farmObj = {
      id: expect.any(Number), irrigationLVL: 0, lastCheckedAt: expect.any(Date),
      length: 3, width: 3, locationCountry: "United States", locationName: "Las Vegas",
      locationRegion: "Nevada"
    };

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      farms: [
        {...farmObj, id: expect.any(Number), lastCheckedAt: expect.any(String)},
        {...farmObj, id: expect.any(Number), lastCheckedAt: expect.any(String)}
      ]
    });

    resp = await request(app).get("/users/usr3/farms").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      farms: []
    });
  });

  it("throws 401 unauthorized if not logged in", async () => {
    const resp = await request(app).get("/users/usr1/farms");
    expect(resp.statusCode).toEqual(401);
  });

  it("throws 404 if no such username", async () => {
    const resp = await request(app).get("/users/idontexist/farms").set("authorization", usr3Token);
    expect(resp.statusCode).toEqual(404);
  });
});

describe("PATCH /users/:username", () => {
  it("works if admin", async () => {
    const resp = await request(app).patch("/users/usr1")
    .send({ email: "newEmail@user.com", funds: 250 }).set("authorization", usr3Token);

    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      user: {
        username: "usr1",
        email: "newEmail@user.com",
        funds: 250
      }
    });
  });

  it("throws 400 badrequest if invalid fields supplied", async () => {
    const resp = await request(app).patch("/users/usr1")
    .send({ password: "newPassword" }).set("authorization", usr3Token);

    expect(resp.statusCode).toEqual(400);
  });

  it("throws 401 unauthorized if not logged in", async () => {
    const resp = await request(app).patch("/users/usr1")
    .send({ email: "newEmail@user.com" });

    expect(resp.statusCode).toEqual(401);
  });

  it("throws 403 forbidden if not admin", async () => {
    const resp = await request(app).patch("/users/usr1")
    .send({ email: "newEmail@user.com" }).set("authorization", usr1Token);

    expect(resp.statusCode).toEqual(403);
  });

  it("throws 404 notfound if invalid username", async () => {
    const resp = await request(app).patch("/users/idontexist")
    .send({ email: "newEmail@user.com" }).set("authorization", usr3Token);

    expect(resp.statusCode).toEqual(404);
  });
})