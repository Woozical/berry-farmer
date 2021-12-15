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
  length: 3,width: 3,
  irrigationLVL: 0, lastCheckedAt: expect.any(Date),
  locationName: 'London', locationRegion: 'England',
  locationCountry: 'United Kingdom',
}

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
    const { id:location } = q.rows[0];
    const res = await Farm.create({ owner: "u1", location });
    expect(res).toEqual({
      id: expect.any(Number),
      width: 3, 
      length: 3,
      lastCheckedAt: expect.any(Date),
      irrigationLVL: 0,
      locationID: location,
      owner: "u1"
    });
  });

  it("throws BadRequestError if invalid owner username", async () => {
    const q = await db.query("SELECT id FROM geo_profiles");
    const { id } = q.rows[0];
    try {
      await Farm.create({owner: "idontexist", location: id});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if invalid location id", async () => {
    try {
      await Farm.create({owner: "u3", location: -1});
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
});

describe("date match test", () => {
  it("works", async () => {
    const today = new Date();
    const q = await db.query("SELECT id FROM geo_profiles");
    const { id: location } = q.rows[0];
    const q2 = await db.query(
      `INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall)
       VALUES ($1, $2, 20, 20, 20)`, [location, today]
    );
    const q3 = await db.query("SELECT location, date FROM weather_data WHERE location = $1 AND date = $2", [location, today]);
    expect(q3.rows[0].date).toEqual(new Date(today.toDateString()));
  });
})

// describe("Crop sync method", () => {

//   it("updates crops", async () => {
//     // Get snapshot of previous crop state
//     const snapshot = await db.query("SELECT * FROM crops WHERE berry_type = 'cheri' ");
//     // Set a control date for time delta operations
//     await db.query('UPDATE farms SET last_checked_at = $1 WHERE id = $2',
//       [new Date('2021-12-10T03:24:00'), snapshot.rows[0].farm_id]);
    
//     // Perform sync
//     const res = await Farm.syncCrops(snapshot.rows[0].farm_id);

//     // Returns object with updated crop data
//     expect(res).toEqual({
//       ...expectFarmObj, id: snapshot.rows[0].farm_id, owner: 'u1', crops: [
//         {
//           id: expect.any(Number),
//           berryType: 'cheri',
//           curGrowthStage: 0,
//           moisture: expect.any(Number),
//           health: expect.any(Number),
//           plantedAt: expect.any(Date),
//           x: expect.any(Number),
//           y: expect.any(Number)
//         }]
//     });

//     // Performs updates on crops
//     const updated = await db.query("SELECT * FROM crops WHERE berry_type = 'cheri' ");
//     expect(snapshot.rows[0].moisture).not.toEqual(updated.rows[0].moisture);
//   });

//   it("updates lastCheckedAt on farm", async () => {
//     const q = await db.query("SELECT * FROM farms");
//     const { id } = q.rows[0];
//     await Farm.syncCrops(id);
//     const u = await db.query("SELECT * FROM farms WHERE id = $1", [id]);
//     expect(q.rows[0].last_checked_at).not.toEqual(u.rows[0].last_checked_at);
//     expect(u.rows[0].last_checked_at).toBeInstanceOf(Date);
//   });

//   it("throws NotFoundError if id is invalid", async () => {
//     try {
//       await Farm.syncCrops(-1);
//       fail();
//     } catch (err) {
//       expect(err).toBeInstanceOf(NotFoundError);
//     }
//   });
// });