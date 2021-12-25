"use strict";

import db from "../../db";
import User from "../../models/user";
import { createToken } from "../../utils/token";

async function commonBeforeAll() {
  await db.query("DELETE FROM users");

  await User.register({
    username: "usr1",
    email: "user1@user.com",
    password: "password1",
  });
  await User.register({
    username: "usr2",
    email: "user2@user.com",
    password: "password2",
  });
  await User.register({
    username: "usr3",
    email: "user3@user.com",
    password: "password3",
  });
}

async function commonBeforeEach() {
  await db.query("BEGIN");
}

async function commonAfterEach() {
  await db.query("ROLLBACK");
}

async function commonAfterAll() {
  await db.end();
}

const u1Token = createToken({ username: "u1", isAdmin: false });
const u2Token = createToken({ username: "u2", isAdmin: false  });
const u3Token = createToken({ username: "u3", isAdmin: false });


export {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token
};