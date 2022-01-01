"use strict";
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const PORT = process.env.PORT ? +process.env.PORT : 3001;
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || "wAPI-key-dev"; 
const NEW_ACCOUNT_FUNDS = 1500;
const FARM_SYNC_TIMER = 600000; // time, in ms, inbetween farm syncs in which a new sync must be performed to access or modify the farm
const API_URL = (process.env.NODE_ENV === "test") ? "http://deadendpoint.blahblah" : "http://api.weatherapi.com/v1";

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? "berry_farmer_test"
      : process.env.DATABASE_URL || "berry_farmer";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 13;

if (process.env.NODE_ENV !== "test"){
  console.log("Berry Farmer Config:");
  console.log("PORT:", PORT);
  console.log("BCRYPT_WORK_FACTOR:", BCRYPT_WORK_FACTOR);
  console.log("Database:", getDatabaseUri());
  console.log("---");
}

export {
  API_URL,
  FARM_SYNC_TIMER,
  NEW_ACCOUNT_FUNDS,
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  WEATHER_API_KEY,
  getDatabaseUri,
};