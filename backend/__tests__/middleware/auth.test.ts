//@ts-nocheck
"use strict";

import jwt from "jsonwebtoken";
import { ForbiddenError, UnauthorizedError } from "../../expressError";
import { authenticateJWT, ensureLoggedIn, ensureAdmin, ensureSameUser } from "../../middleware/auth";
import { SECRET_KEY } from "../../config";

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