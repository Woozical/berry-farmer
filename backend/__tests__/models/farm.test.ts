"use strict";


import Farm from "../../models/farm";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";
import { BadRequestError, NotFoundError } from "../../expressError";
import db from "../../db";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

/** Expected Farm response object for farm owned by user 'u1' */
const expectFarmObj = {
  length: 3, width: 3,
  irrigationLVL: 0, lastCheckedAt: expect.any(Date),
  locationName: 'London', locationRegion: 'England',
  locationCountry: 'United Kingdom',
}

describe("smoke tests", () => {
  let id:number, locationID:number;
  beforeAll( async () => {
    const q = await db.query("SELECT * FROM farms");
    id = q.rows[0].id;
    const q2 = await db.query("SELECT * FROM geo_profiles");
    locationID = q2.rows[0].id;
  });
  test("get method", async () => {
    await Farm.get(id);
  });
  test("get by owner method", async () => {
    await Farm.getByOwner("u1");
  });
  test("cropSync method", async () => {
    await Farm.syncCrops(id);
  });
  test("create method", async () => {
    await Farm.create({ owner: "u1", locationID });
  });
  test("delete method", async () => {
    await Farm.delete(id);
  });
});

describe("Get method", () => {
  it("retrieves full farm data by ID", async () => {
    const q = await db.query(
      "SELECT farms.id FROM farms JOIN geo_profiles ON geo_profiles.id = farms.location WHERE geo_profiles.name = 'London'"
    );
    const { id } = q.rows[0];
    const res = await Farm.get(id);
    expect(res).toEqual({...expectFarmObj, id, owner: 'u1', crops: [
      { id: expect.any(Number),
        berryType: 'cheri',
        curGrowthStage: 0,
        moisture: expect.any(Number),
        health: expect.any(Number),
        plantedAt: expect.any(Date),
        x: expect.any(Number),
        y: expect.any(Number)
      }
    ]});
  });

  it("throws NotFoundError if no farm with such ID", async () => {
    try {
      await Farm.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
  });
});

describe("Get by owner method" , () => {
  it("retrieves list of farm data owned by given username", async () => {
    // insert a 2nd farm for user 'u1'
    const q = await db.query("SELECT id FROM geo_profiles WHERE name = 'London' ");
    const { id } = q.rows[0];
    await db.query("INSERT INTO farms (owner, location) VALUES ($1, $2)", ["u1", id])

    // This list of farm data does not include crop data for each farm
    const res = await Farm.getByOwner("u1");
    expect(res).toEqual(
      [
        {...expectFarmObj, id: expect.any(Number)},
        { ...expectFarmObj, id: expect.any(Number)}
      ]
    );
    
    // empty array if user exists but has no farms
    const res2 = await Farm.getByOwner("u3");
    expect(res2).toEqual([]);
  });

  it("throws NotFoundError if username is invalid", async () => {
    try { 
      await Farm.getByOwner("idontexist");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
  });
});

describe("Create method", () => {
  it("works", async () => {
    const q = await db.query("SELECT id FROM geo_profiles");
    const { id:locationID } = q.rows[0];
    const res = await Farm.create({ owner: "u1", locationID });
    expect(res).toEqual({
      id: expect.any(Number),
      width: 3, 
      length: 3,
      lastCheckedAt: expect.any(Date),
      irrigationLVL: 0,
      locationID,
      owner: "u1"
    });
  });

  it("throws BadRequestError if invalid owner username", async () => {
    const q = await db.query("SELECT id FROM geo_profiles");
    const { id: locationID } = q.rows[0];
    try {
      await Farm.create({owner: "idontexist", locationID});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if invalid location id", async () => {
    try {
      await Farm.create({owner: "u3", locationID: -1});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("Delete method", () => {
  it("works", async () => {
    const q = await db.query("SELECT id FROM farms");
    const { id } = q.rows[0];
    const res = await Farm.delete(id);
    expect(res).toEqual({ deleted: id });
    // changes reflect in db
    const q2 = await db.query("SELECT * FROM farms WHERE id = $1", [id]);
    expect(q2.rowCount).toEqual(0);
  });

  it("throws NotFoundError on invalid id", async () => {
    try {
      await Farm.delete(-1);
      fail();
    } catch (err){
      expect(err).toBeInstanceOf(NotFoundError);
    }
  })
});

describe("Check ownership method", () => {
  it("works", async () => {
    const q = await db.query("SELECT id FROM farms WHERE owner = 'u1' ");
    const { id:farmID } = q.rows[0];
    expect( await Farm.checkOwnership(farmID, 'u1') ).toEqual(true);
    expect( await Farm.checkOwnership(farmID, 'u2') ).toEqual(false);
    expect( await Farm.checkOwnership(farmID, 'idontexist') ).toEqual(false);
  });

  it("throws NotFoundError on invalid farm ID", async () => {
    try {
      await Farm.checkOwnership(-1, "u1");
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("Update method", () => {
  it("works", async () => {
    let q = await db.query("SELECT id FROM farms");
    const { id } = q.rows[0];
    const d = new Date();
    const res = await Farm.update(id, { lastCheckedAt: d, irrigationLVL: 4, length : 5 });
    expect(res).toEqual({
      id, length: 5, irrigationLVL: 4, lastCheckedAt: d,
      width: 3, owner: expect.any(String), locationID: expect.any(Number),
    });

    // changes reflect in db
    q = await db.query("SELECT * FROM farms WHERE id = $1", [id]);
    const r = q.rows[0];
    expect(r.last_checked_at).toEqual(d);
    expect(r.irrigation_lvl).toEqual(4);
    expect(r.length).toEqual(5);
  });

  it("throws NotFoundError on invalid id", async () => {
    try {
      await Farm.update(-1, { irrigationLVL: 3 });
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

/** TO DO: Change seed weather data for less extreme conditions, more accurate test environment for sync operation */
describe("Crop sync method", () => {
  /** Define constants */
  const hour = 3600000;
  const today = new Date();
  const yesterday = new Date(today.getTime() - (hour * 24));
  const dayBefore = new Date(today.getTime() - (hour * 48));
  let location:number, farmID:number;

  beforeAll( async () => {
    /** Seed common control parameters */
    // Control location (to avoid weather_data violations on existing locations in test db)
    let q = await db.query(`
      INSERT INTO geo_profiles (name, region, country)
      VALUES ('Control Town', 'North Controlina', 'Controlada')
      RETURNING id`);
    location = q.rows[0].id;
    // Weather Data: 60 Avg Temp and Cloud for today and yesterday, 1mm of rainfall
    await db.query(
      `INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall)
        VALUES ($1, $2, 60, 60, 1),
               ($1, $3, 60, 60, 1),
               ($1, $4, 60, 60, 1)`,
      [location, today, yesterday, dayBefore]);
    // Control user
    await db.query(
      `INSERT INTO users (username, email, password)
       VALUES ('controlUser', 'cu@mail.com', 'password')`
    );
    // Control farm
    q = await db.query(
      `INSERT INTO farms (owner, location)
        VALUES ('controlUser', $1) RETURNING id`,
        [location]
    );
    farmID = q.rows[0].id;
  })

  it("test 1: cgs 0, timeDelta does not reach growth stage", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 2));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 0, 100, 100, $1, $2, 0, 0),
              ('pecha', 0, 100, 100, $1, $2, 0, 1)`,
       [plantedAt, farmID]
    );
    // 2 hour time delta, irrigation lvl should not factor outside growth stages
    await db.query('UPDATE farms SET last_checked_at = $1, irrigation_lvl = 2 WHERE id = $2', [plantedAt, farmID]);
    
    // Perform sync, moisture should drop from 100 -> 78.3 (2 hours: 30 dehydration, +8.3 from 0.08333mm rain)
    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1", [farmID]);
    expect(Number(q.rows[0].moisture)).toBeCloseTo(78.33);
    expect(Number(q.rows[1].moisture)).toBeCloseTo(78.33);
  });

  it("test 2: cgs 0, timeDelta 4 hours passes 1 growth stage", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 4));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 0, 100, 100, $1, $2, 0, 0),
              ('pecha', 0, 100, 100, $1, $2, 0, 1)`,
       [plantedAt, farmID]
    );
    // 4 hour time delta
    await db.query('UPDATE farms SET last_checked_at = $1 WHERE id = $2', [plantedAt, farmID]);
    
    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1", [farmID]);
    for (let row of q.rows){
      expect(Number(row.moisture)).toBeCloseTo(56.66, 1);
      expect(Number(row.health)).toBeCloseTo(48.418);
      expect(row.cur_growth_stage).toEqual(1);
    }
  });

  it("test 3: cgs 0, timeDelta 7 hours passes 2 growth stage", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 7));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 0, 100, 100, $1, $2, 0, 0),
              ('pecha', 0, 100, 100, $1, $2, 0, 1)`,
       [plantedAt, farmID]
    );
    // 7 hour time delta
    await db.query('UPDATE farms SET last_checked_at = $1 WHERE id = $2', [plantedAt, farmID]);
    
    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1", [farmID]);
    for (let row of q.rows){
      expect(Number(row.moisture)).toBeCloseTo(24.166, 1);
      expect(Number(row.health)).toBeCloseTo(0);
      expect(row.cur_growth_stage).toEqual(2);
    }
  });

  it("test 4: as test 3, with irrigation = 2", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 7));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 0, 100, 100, $1, $2, 0, 0),
              ('pecha', 0, 100, 100, $1, $2, 0, 1)` ,
       [plantedAt, farmID]
    );
    // 7 hour time delta, irrig 2
    await db.query('UPDATE farms SET last_checked_at = $1, irrigation_lvl = 2 WHERE id = $2', [plantedAt, farmID]);
    
    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1", [farmID]);
    for (let row of q.rows){
      expect(Number(row.moisture)).toBeCloseTo(57.966, 1);
      expect(Number(row.health)).toBeCloseTo(28.876);
      expect(row.cur_growth_stage).toEqual(2);
    }
  });

  it("test 5: cgs 2, timeDelta does not reach growth stage", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 7));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 2, 100, 100, $1, $2, 0, 0),
              ('pecha', 2, 100, 100, $1, $2, 0, 1)`,
      [plantedAt, farmID]
    );

    // 1 hour time delta
    await db.query('UPDATE farms SET last_checked_at = $1 WHERE id = $2',
    [new Date(today.getTime() - (hour)), farmID]);

    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1", [farmID]);
    for (let row of q.rows){
      expect(Number(row.moisture)).toBeCloseTo(89.166);
      expect(Number(row.health)).toEqual(100);
      expect(row.cur_growth_stage).toEqual(2);
    }
  });

  it("test 6: cgs 3, planted 30 hours ago", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 30));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 3, 100, 100, $1, $2, 0, 0),
              ('pecha', 3, 100, 100, $1, $2, 0, 1)`,
      [plantedAt, farmID]
    );

    // effective 2 hour time delta, 20 hours since last checked
    await db.query("UPDATE farms SET last_checked_at = $1 WHERE id = $2",
    [new Date(plantedAt.getTime() + (hour * 10)), farmID]);

    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1", [farmID]);
    for (let row of q.rows){
      expect(Number(row.moisture)).toBeCloseTo(78.33);
      expect(Number(row.health)).toBeCloseTo(58.418);
      expect(row.cur_growth_stage).toEqual(4)
    }
  });

  it("test 7: ignores fully grown", async () => {
    // Control crops
    const plantedAt = new Date(today.getTime() - (hour * 2));
    const longAgo = new Date(today.getTime() - (hour * 240));
    await db.query(
      `INSERT INTO crops (berry_type, cur_growth_stage, health, moisture, planted_at, farm_id, farm_x, farm_y)
       VALUES ('pecha', 0, 100, 100, $1, $2, 0, 0),
              ('pecha', 0, 100, 100, $1, $2, 0, 1),
              ('pecha', 4, 100, 100, $3, $2, 0, 2)`,
       [plantedAt, farmID, longAgo]
    );
    // 2 hour time delta, irrigation lvl should not factor outside growth stages
    await db.query('UPDATE farms SET last_checked_at = $1, irrigation_lvl = 2 WHERE id = $2', [plantedAt, farmID]);
    
    // Perform sync, moisture should drop from 100 -> 78.3 (2 hours: 30 dehydration, +8.3 from 0.08333mm rain)
    // Smoke test, pullSyncData in Farm should not look at fully grown, if it does, an error will occur here 
    // as it looks for older weather data than what we have in the test DB.
    await Farm.syncCrops(farmID);

    // Check DB changes
    const q = await db.query("SELECT * FROM crops WHERE farm_id = $1 ORDER BY cur_growth_stage", [farmID]);
    expect(Number(q.rows[0].moisture)).toBeCloseTo(78.33);
    expect(Number(q.rows[1].moisture)).toBeCloseTo(78.33);
    // No calculations on fully grown
    expect(Number(q.rows[2].moisture)).toBeCloseTo(100);
  });

  it("test 8: works with no crops", async () => {
    const q = await db.query("SELECT last_checked_at FROM farms WHERE id = $1", [farmID]);
    await db.query("DELETE FROM crops WHERE farm_id = $1", [farmID]);
    await Farm.syncCrops(farmID);
    const u = await db.query("SELECT last_checked_at FROM farms WHERE id = $1", [farmID]);
    // no error
    // lastCheckedAt updated
    expect(q.rows[0].last_checked_at).not.toEqual(u.rows[0].last_checked_at);
    expect(q.rows[0].last_checked_at.getTime()).toBeLessThan(u.rows[0].last_checked_at.getTime());
  });

  it("updates lastCheckedAt on farm", async () => {
    const q = await db.query("SELECT * FROM farms");
    const { id } = q.rows[0];
    await Farm.syncCrops(id);
    const u = await db.query("SELECT * FROM farms WHERE id = $1", [id]);
    expect(q.rows[0].last_checked_at).not.toEqual(u.rows[0].last_checked_at);
    expect(u.rows[0].last_checked_at).toBeInstanceOf(Date);
  });

  it("throws NotFoundError if id is invalid", async () => {
    try {
      await Farm.syncCrops(-1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});