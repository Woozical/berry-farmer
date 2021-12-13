"use strict";

import db from"../../db";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../expressError";
import User from "../../models/user";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("Registration Method", () => {
  // new user template
  const newUser = { username: "new", email: "user@mail.com" };

  it("creates a new user in DB", async () => {
    const user = await User.register({ ...newUser, password: "password" });
    // Should return an object with user data, sans password hash
    expect(user).toEqual({...newUser, funds: 0});
    
    // User should exist in db with correct data
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].email).toEqual("user@mail.com");
    expect(found.rows[0].funds).toEqual("0");
    // User's password should be hashed
    expect(found.rows[0].password).not.toEqual("password");
    expect(found.rows[0].password.startsWith("$2b$")).toEqual(true);
  });

  it("throws bad request error on dupe username", async () => {
    try {
      await User.register({ ...newUser, password: "password" });
      await User.register({ ...newUser, email: "new44@mail.com", password: "password" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toEqual(true);
    }
  });

  it("throws bad request error on dupe email", async () => {
    try {
      await User.register({ ...newUser, password: "password" });
      await User.register({ ...newUser, username: "new22", password: "password" });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toEqual(true);
    }
  })
});

describe("Authentication Method", () => {
  it("returns user object on success", async () => {
    const res = await User.authenticate("u1", "pw1");
    expect(res).toEqual({username: "u1", email: "u1@mail.com", funds: 0});
  });

  it("throws NotFoundError if no such user", async () => {
    try{
      await User.authenticate("idontexist", "pass");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
  });

  it("throws UnauthorizedError if no password match", async () => {
    try {
      await User.authenticate("u1", "incorrectpassword");
      fail();
    } catch (err) {
      expect(err instanceof UnauthorizedError).toEqual(true);
    }
  });
});

