import db from "../../db";
import bcrypt from "bcrypt";
import { BCRYPT_WORK_FACTOR } from "../../config";

async function commonBeforeAll(){
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
    `INSERT INTO users (username, email, password)
     VALUES ('u1', 'u1@mail.com', $1),
            ('u2', 'u2@mail.com', $2),
            ('u3', 'u3@mail.com', $3)`,
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
  await db.query(
    `INSERT INTO crops (berry_type, farm_id, farm_x, farm_y, moisture)
     VALUES ('cheri', $1, 0, 0, 50),
            ('chesto', $2, 1, 1, 0)`,
    farmIDs
  );

  /** seed weather_data */
  await db.query(
    `INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall)
     VALUES ($1, '2010-01-10', 10, 0.1, 1.0 ),
            ($1, '2011-11-11', 11, 1.1, 1.1 ),
            ($2, '2020-02-20', 20, 0.2, 2.0 ),
            ($2, '2020-12-12', 12, 1.2, 1.2)`,
    locationIDs
  );

  /** seed user inventories */
  await db.query(
    `INSERT INTO user_inventories (username, berry_type, amount)
     VALUES ('u1', 'cheri', 1),
            ('u2', 'chesto', 2),
            ('u3', 'pecha', 3)`
  );
}

async function commonBeforeEach(){
  await db.query("BEGIN");
}

async function commonAfterEach(){
  await db.query("ROLLBACK");
}

async function commonAfterAll(){
  await db.end(); 
}

export { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach };