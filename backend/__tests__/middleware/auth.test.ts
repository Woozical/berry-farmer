//@ts-nocheck
"use strict";

import jwt from "jsonwebtoken";
import { BadRequestError, ForbiddenError, UnauthorizedError } from "../../expressError";
import { authenticateJWT, ensureLoggedIn, ensureAdmin, ensureSameUser, ensureOwnedBy } from "../../middleware/auth";
import { SECRET_KEY } from "../../config";
import { cropID, cropID2, dbAfterAll, dbAfterEach, dbBeforeAll, dbBeforeEach, farmID, farmID2 } from "./_testDBSetup";

const testJwt = jwt.sign({ username: "test", isAdmin: false }, SECRET_KEY);
const badJwt = jwt.sign({ username: "test", isAdmin: false }, "wrong");


describe("authenticateJWT", function () {
  test("works: via header", function () {
    expect.assertions(2);
     //there are multiple ways to pass an authorization token, this is how you pass it in the header.
    //this has been provided to show you another way to pass the token. you are only expected to read this code for this project.
    const req = { headers: { authorization: `Bearer ${testJwt}` } };
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };

    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({
      user: {
        iat: expect.any(Number),
        username: "test",
        isAdmin: false,
      },
    });
  });

  test("works: no header", function () {
    expect.assertions(2);
    const req = {};
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });

  test("works: invalid token", function () {
    expect.assertions(2);
    const req = { headers: { authorization: `Bearer ${badJwt}` } };
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    authenticateJWT(req, res, next);
    expect(res.locals).toEqual({});
  });
});


describe("ensureLoggedIn", function () {
  test("works", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", is_admin: false } } };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    ensureLoggedIn(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
    };
    ensureLoggedIn(req, res, next);
  });
});

describe("ensureAdmin", function () {
  test("works", function() {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: true } } };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    ensureAdmin(req, res, next);
  });

  test("forbidden if not admin", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    ensureAdmin(req, res, next);
  });

  test("unauth if no login", function () {
    expect.assertions(1);
    const req = {};
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
    };
    ensureAdmin(req, res, next);
  });
});

describe("ensureSameUser", function () {
  const req = { params: { username: "test" } };
  
  test("works", function () {
    expect.assertions(1);
    const res = { locals: { user: { username: "test", isAdmin: false } } };
    const next = function (err:any) { 
      expect(err).toBeFalsy();
    };
    ensureSameUser(req, res, next);
  });
  
  test("works if admin", function () {
    expect.assertions(1);
    const res = { locals: { user: { username: "test2", isAdmin: true } } };
    const next = function (err:any) { 
      expect(err).toBeFalsy();
    };
    ensureSameUser(req, res, next);
  });

  test("forbidden if not same user", function () {
    expect.assertions(1);
    const res = { locals: { user: { username: "test2", isAdmin: false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    ensureSameUser(req, res, next);
  });

  test("unauth if not logged in", function () {
    expect.assertions(1);
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
    };
    ensureSameUser(req, res, next);
  });
});

/** This middleware queries the db, so some setup is needed for these tests.
 *  cropID and farmID imported from setup file
*/
describe("ensureOwnedBy", function () {
  beforeAll(dbBeforeAll);
  beforeEach(dbBeforeEach);
  afterEach(dbAfterEach);
  afterAll(dbAfterAll);

  test("works with admin", async function () {
    expect.assertions(1);
    const req = { params: {}, body: { farmID } };
    const res = { locals: { user: { username: "u3", isAdmin:true } } };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    await ensureOwnedBy(req, res, next);
  });

  test("works with params.cropID requests", async function () {
    expect.assertions(1);
    const req = { body: {}, params: { cropID: `${cropID}`} };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    await ensureOwnedBy(req, res, next);
  });

  test("works with params.farmID requests", async function () {
    expect.assertions(1);
    const req = { body: {}, params: { farmID: `${farmID}`} };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    await ensureOwnedBy(req, res, next);
  });

  test("works with body.farmID requests",  async function () {
    expect.assertions(1);
    const req = { params: {}, body: { farmID } };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeFalsy();
    };
    await ensureOwnedBy(req, res, next);
  });

  test("params.cropID: forbidden", async function () {
    expect.assertions(1);
    const req = { body: {}, params: { cropID: `${cropID}`} };
    const res = { locals: { user: { username: "u2", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("params.farmID: forbidden", async function () {
    expect.assertions(1);
    const req = { body: {}, params: { farmID: `${farmID}` } };
    const res = { locals: { user: { username: "u2", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("body.farmID: forbidden", async function () {
    expect.assertions(1);
    const req = { params: {}, body: { farmID } };
    const res = { locals: { user: { username: "u2", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("exploit prevent: send owned cropID in body to access un-owned farmID in params", async function () {
    expect.assertions(1);
    console.log(farmID, farmID2);
    const req = { params: { farmID: `${farmID2}` }, body: { cropID } };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("exploit prevent: send owned farmID in body to access un-owned cropID in params", async function () {
    expect.assertions(1);
    console.log(farmID, farmID2);
    const req = { params: { cropID: `${cropID2}` }, body: { farmID } };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("exploit prevent: send owned farmID in body to access un-owned farmID in params", async function () {
    expect.assertions(1);
    console.log(farmID, farmID2);
    const req = { params: { farmID: `${farmID2}` }, body: { farmID } };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("exploit prevent: send owned cropID in body to access un-owned cropID in params", async function () {
    expect.assertions(1);
    console.log(farmID, farmID2);
    const req = { params: { cropID: `${cropID2}` }, body: { cropID } };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(ForbiddenError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("not logged in: unauth", async function () {
    expect.assertions(1);
    const req = { params: {}, body: { farmID } };
    const res = { locals: {} };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(UnauthorizedError);
    };
    await ensureOwnedBy(req, res, next);
  });

  test("bad request error", async function () {
    expect.assertions(1);
    const req = { params: {}, body: {} };
    const res = { locals: { user: { username: "u1", isAdmin:false } } };
    const next = function (err:any) {
      expect(err).toBeInstanceOf(BadRequestError);
    };
    await ensureOwnedBy(req, res, next);
  });
});