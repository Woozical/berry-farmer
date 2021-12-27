import db from "../../db";
import bcrypt from "bcrypt";
import { BCRYPT_WORK_FACTOR } from "../../config";

let farmID:number, cropID:number, cropID2:number, farmID2:number;

async function dbBeforeAll(){
  /** Wipe DB */
  await db.query("DELETE FROM crops");
  await db.query("DELETE FROM farms");
  await db.query("DELETE FROM weather_data");
  await db.query("DELETE FROM user_inventories");
  await db.query("DELETE FROM berry_profiles");
  await db.query("DELETE FROM geo_profiles");
  await db.query("DELETE FROM users");

  /** seed users */
  await db.query(
    `INSERT INTO users (username, email, password, is_admin)
     VALUES ('u1', 'u1@mail.com', $1, false),
            ('u2', 'u2@mail.com', $2, false),
            ('u3', 'u3@mail.com', $3, true)`,
    [
      await bcrypt.hash("pw1", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("pw2", BCRYPT_WORK_FACTOR),
      await bcrypt.hash("pw3", BCRYPT_WORK_FACTOR)
    ]
  );
  
  /** seed berry_profiles */
  await db.query(
    `INSERT INTO berry_profiles (name, growth_time, size, dry_rate, poke_type, poke_power, ideal_temp, ideal_cloud)
     VALUES ('cheri', 3, 20, 10, 'fire', 60, 90, 15),
            ('chesto', 3, 80, 30, 'water', 60, 70, 15),
            ('pecha', 3, 40, 15, 'electric', 60, 70, 70)`
  );

  /** seed geo_profiles */
  const gpRes = await db.query(
    `INSERT INTO geo_profiles (name, region, country)
     VALUES ('London', 'England', 'United Kingdom'),
            ('Las Vegas', 'Nevada', 'United States')
     RETURNING id`
  );
  const locationIDs = [gpRes.rows[0].id, gpRes.rows[1].id];

  /** seed farms */
  const fRes = await db.query(
    `INSERT INTO farms (owner, location)
     VALUES ('u1', $1),
            ('u2', $2)
     RETURNING id`,
    locationIDs
  );
  const farmIDs = [fRes.rows[0].id, fRes.rows[1].id];

  /** seed crops */
  const cRes = await db.query(
    `INSERT INTO crops (berry_type, farm_id, farm_x, farm_y, moisture)
     VALUES ('cheri', $1, 0, 0, 50),
            ('chesto', $2, 1, 1, 0) RETURNING id`,
    farmIDs
  );
  [farmID, farmID2] = farmIDs;
  cropID = cRes.rows[0].id;
  cropID2 = cRes.rows[1].id;
}

async function dbBeforeEach(){
  await db.query("BEGIN");
}

async function dbAfterEach(){
  await db.query("ROLLBACK");
}

async function dbAfterAll(){
  await db.end(); 
}

export { farmID, farmID2,  cropID, cropID2,  dbAfterAll, dbAfterEach, dbBeforeAll, dbBeforeEach };