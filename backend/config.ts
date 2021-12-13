"use strict";
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY || "secret-dev";
const PORT = process.env.PORT ? +process.env.PORT : 3001;

// Use dev database, testing database, or via env var, production database
function getDatabaseUri() {
  return (process.env.NODE_ENV === "test")
      ? "berry_farmer_test"
      : process.env.DATABASE_URL || "berry_farmer";
}

// Speed up bcrypt during tests, since the algorithm safety isn't being tested
const BCRYPT_WORK_FACTOR = process.env.NODE_ENV === "test" ? 1 : 13;

console.log("Jobly Config:");
console.log("SECRET_KEY:", SECRET_KEY);
console.log("PORT:", PORT);
console.log("BCRYPT_WORK_FACTOR:", BCRYPT_WORK_FACTOR);
console.log("Database:", getDatabaseUri());
console.log("---");

export {
  SECRET_KEY,
  PORT,
  BCRYPT_WORK_FACTOR,
  getDatabaseUri,
};