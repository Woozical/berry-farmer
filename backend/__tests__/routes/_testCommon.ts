"use strict";

import db from "../../db";
import User from "../../models/user";
import Farm from "../../models/farm";
import GeoProfile from "../../models/geoProfiles";
import { createToken } from "../../utils/token";
import axios from "axios";
import API_RESPONSE from "../resources/weather-history-response.json";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;
// mockedAxios.get.mockResolvedValue({data : API_RESPONSE});

async function seedUsers(){
  const s = [
    User.register({username: "usr1", email: "user1@user.com", password: "password1"}),
    User.register({username: "usr2", email: "user2@user.com", password: "password2"}),
    User.register({username: "usr3", email: "user3@user.com", password: "password3"}),
  ]
  await Promise.all(s);
}

async function seedGeoProfile(){
  mockedAxios.get.mockResolvedValue({data : API_RESPONSE});
  await GeoProfile.create("london");
}

async function commonBeforeAll() {
  /** Wipe DB */
  await db.query("DELETE FROM crops");
  await db.query("DELETE FROM farms");
  await db.query("DELETE FROM weather_data");
  await db.query("DELETE FROM user_inventories");
  await db.query("DELETE FROM berry_profiles");
  await db.query("DELETE FROM geo_profiles");
  await db.query("DELETE FROM users");

  await seedUsers();
  // await seedGeoProfile();
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

const u1Token = createToken({ username: "usr1", isAdmin: false });
const u2Token = createToken({ username: "usr2", isAdmin: false  });
const u3Token = createToken({ username: "usr3", isAdmin: true });


export {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  u3Token
};