"use strict";

import db from "../../db";
import User from "../../models/user";
import Farm from "../../models/farm";
import Crop from "../../models/crop";
import { createToken } from "../../utils/token";
import app from "../../app";
import initMarketPrices from "../../utils/marketPrices";

let locationID:number;
let farmIDs:Array<number>;
let cropIDs:Array<number>;

async function seedUsers(){
  const s = [
    User.register({username: "usr1", email: "user1@user.com", password: "password1"}),
    User.register({username: "usr2", email: "user2@user.com", password: "password2"}),
    User.register({username: "usr3", email: "user3@user.com", password: "password3"}),
  ]
  await Promise.all(s);
}

async function seedGeoProfile(){
  const q = await db.query(
    `INSERT INTO geo_profiles (name, region, country)
     VALUES ('Las Vegas', 'Nevada', 'United States')
     RETURNING id`
  );
  return q.rows[0].id;
}

async function seedBerryProfiles(){
  await db.query(
    `INSERT INTO berry_profiles (name, growth_time, size, dry_rate, poke_type, poke_power, ideal_temp, ideal_cloud)
     VALUES ('cheri', 3, 20, 10, 'fire', 60, 90, 15),
            ('chesto', 3, 80, 30, 'water', 60, 70, 15),
            ('pecha', 3, 40, 15, 'electric', 60, 70, 70)`
  );
}

async function seedFarms(){
  const f = [
    Farm.create({owner: "usr1", locationID}),
    Farm.create({owner: "usr2", locationID}),
    Farm.create({owner: "usr2", locationID})
  ]
  const r = await Promise.all(f);
  return [r[0].id, r[1].id, r[2].id];
}

async function seedCrops(){
  const c = [
    Crop.create({berryType: "cheri", farmID: farmIDs[0], farmX: 0, farmY: 0}),
    Crop.create({berryType: "chesto", farmID: farmIDs[1], farmX: 0, farmY: 0}),
    Crop.create({berryType: "cheri", farmID: farmIDs[2], farmX: 0, farmY: 0}),
    Crop.create({berryType: "pecha", farmID: farmIDs[2], farmX: 1, farmY: 0}),
  ]
  const r = await Promise.all(c);
  return [r[0].id, r[1].id, r[2].id, r[3].id];
}

async function seedWeatherData(){
  await db.query(
    `INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall)
     VALUES ($1, $2, 10, 10, 1.0 )`,
    [locationID, new Date()]
  );
}

async function seedUserInventories(){
  const i = [
    User.addBerry("usr1", "cheri", 1),
    User.addBerry("usr2", "chesto", 2),
    User.addBerry("usr3", "pecha", 3)
  ];
  await Promise.all(i);
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
  await seedBerryProfiles();
  locationID = await seedGeoProfile();
  farmIDs = await seedFarms();
  cropIDs = await seedCrops();
  await seedWeatherData();
  await seedUserInventories();

  /** Init our app.locals, since supertest does not use index.ts to start up server */
  const { mods, prices } = await initMarketPrices();
  app.locals.marketPrices = prices;
  app.locals.marketMods = mods;
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
  locationID,
  cropIDs,
  farmIDs,
  u1Token,
  u2Token,
  u3Token
};