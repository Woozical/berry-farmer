"use strict";


import User from "../../models/user";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../../expressError";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";
import db from"../../db";

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
    expect(user).toEqual({...newUser, funds: 0, isAdmin: false });
    
    // User should exist in db with correct data
    const found = await db.query("SELECT * FROM users WHERE username = 'new'");
    expect(found.rows.length).toEqual(1);
    expect(found.rows[0].email).toEqual("user@mail.com");
    expect(found.rows[0].funds).toEqual("0");
    expect(found.rows[0].is_admin).toEqual(false);
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
    expect(res).toEqual({username: "u1", email: "u1@mail.com", funds: 0, isAdmin: false});
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

describe("Delete method", () => {
  it("removes user and associated entries from db", async () => {
    await User.delete("u1");
    let q = await db.query("SELECT * FROM users WHERE username = 'u1' ");
    expect(q.rowCount).toEqual(0);
    q = await db.query("SELECT * FROM users");
    expect(q.rowCount).not.toEqual(0);
  });
  
  it("throws NotFoundError if no such user", async () => {
    try {
      await User.delete("idontexist");
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
})

describe("Update method", () => {
  it("updates user with given key/val pairs", async () => {
    const u1 = await User.update("u1", { funds: 500 });
    const u2 = await User.update("u2", { funds: 15, email: "u22@mail.com" });

    // Returns user object with updated info
    expect(u1).toEqual({username: "u1", email: "u1@mail.com", funds: 500});
    expect(u2).toEqual({username: "u2", email: "u22@mail.com", funds: 15});

    // Changes exist in the db
    const result = await db.query("SELECT username, email, funds FROM users WHERE username = 'u1' OR username = 'u2' ORDER BY username");
    const [db1, db2] = result.rows;
    expect(db1.funds).toEqual("500");
    expect(db2.email).toEqual("u22@mail.com");
    expect(db2.funds).toEqual("15");
  });

  it("throws BadRequestError if given invalid username", async () => {
    try {
      await User.update("idontexist", { funds: 500 });
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toEqual(true);
    }
  });
});

describe("Get method", () => {
  it("retrieves user info with given username", async () => {
    const res = await User.get("u1", false);
    expect(res).toEqual({username: "u1", farmCount: 1, email: "u1@mail.com", funds: 0});
  });

  it("respects privacy by default", async () => {
    const res = await User.get("u3");
    expect(res).toEqual({username: "u3", farmCount: 0, funds: 0});
  });
  
  it("throws NotFoundError if given invalid username", async () => {
    try {
      await User.get("idontexist");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
  });
});

describe("Add Berry method", () => {
  it("creates new rows on user_inventories", async () => {
    await User.addBerry("u1", "chesto", 2);
    
    // changes reflect in db
    const q = await db.query("SELECT amount FROM user_inventories WHERE username = 'u1' AND berry_type = 'chesto' ");
    expect(q.rows[0].amount).toEqual(2);
  });

  it("works with existing rows on user_inventories", async () => {
    await User.addBerry("u1", "cheri", 5);
    // changes reflect in db
    const q = await db.query("SELECT amount FROM user_inventories WHERE username = 'u1' AND berry_type = 'cheri' ");
    expect(q.rows[0].amount).toEqual(6);
  });

  it("throws BadRequestError if invalid username", async () => {
    try {
      await User.addBerry("idontexist", "cheri", 3);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if amount is not positive", async () => {
    try {
      await User.addBerry("u1", "pecha", -2);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if invalid berry type", async () => {
    try {
      await User.addBerry("u1", "idontexist", 3);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("Deduct Berry method", () => {
  it("works with existing rows on user_inventories", async () => {
    await User.deductBerry("u1", "cheri", -1);
    // changes reflect in db
    const q = await db.query("SELECT amount FROM user_inventories WHERE username = 'u1' AND berry_type = 'cheri' ");
    expect(q.rows[0].amount).toEqual(0);
  });

  it("throws BadRequestError if invalid username", async () => {
    try {
      await User.deductBerry("idontexist", "cheri", 3);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if db amount drops below 0", async () => {
    try {
      await User.deductBerry("u1", "cheri", -99);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if amount is not negative", async () => {
    try {
      await User.deductBerry("u1", "cheri", 2);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if invalid berry type", async () => {
    try {
      await User.deductBerry("u1", "idontexist", -1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});