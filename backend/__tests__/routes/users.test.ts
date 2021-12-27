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

describe("GET /users/:username", () => {
  it("provides full user info if sameuser", async () => {
    const resp = await request(app).get("/users/usr1").set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      user: {
        username: "usr1",
        email: "user1@user.com",
        funds: 0,
        farmCount: 0
      }
    });
  });

  it("hides sensitive information if not sameuser", async () => {
    const resp = await request(app).get("/users/usr1").set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      message: "ok",
      user: {
        username: "usr1",
        funds: 0,
        farmCount: 0
      }
    });
  });

  it("responds 401 Unauth if not logged in", async () => {
    const resp = await request(app).get("/users/usr1");
    expect(resp.statusCode).toEqual(401);
  });
  
  it("responds 404 notfound if no such user", async () => {
    const resp = await request(app).get("/users/idontexist").set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});