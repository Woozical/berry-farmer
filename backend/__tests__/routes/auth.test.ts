"use strict";
import request from "supertest";
import app from "../../app";
import User from "../../models/user";
import {
  commonBeforeAll, commonBeforeEach,
  commonAfterEach, commonAfterAll
} from "./_testCommon";
import { NEW_ACCOUNT_FUNDS } from "../../config";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /auth/token */

describe("POST /auth/login", function () {
  test("works", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          username: "usr1",
          password: "password1",
        });
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  test("404 with non-existent user", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          username: "no-such-user",
          password: "password1",
        });
    expect(resp.statusCode).toEqual(404);
  });

  test("unauth with wrong password", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          username: "usr1",
          password: "nope",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          username: "usr1",
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/auth/login")
        .send({
          username: 42,
          password: "above-is-a-number",
        });
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** POST /auth/register */

describe("POST /auth/register", function () {
  test("works", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
          password: "password",
          email: "new@email.com",
        });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      "token": expect.any(String),
    });
  });

  test("initializes user with starting funds", async function () {
    const resp = await request(app)
          .post("/auth/register")
          .send({
            username: "new",
            password: "password",
            email: "new@email.com"
          });
    expect(resp.statusCode).toEqual(201);
    const user = await User.get("new");
    expect(user.funds).toEqual(NEW_ACCOUNT_FUNDS);
  })

  test("bad request with missing fields", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
        });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if username already exists", async function () {
    const resp = await request(app).post("/auth/register")
    .send({ username: "usr1", password: "password", email: "new@email.com "});
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request if duplicate email", async function () {
    const resp = await request(app).post("/auth/register")
    .send({ username: "new", password: "password", email: "user1@user.com" });
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/auth/register")
        .send({
          username: "new",
          password: "password",
          email: "not-an-email",
        });
    expect(resp.statusCode).toEqual(400);
  });
});