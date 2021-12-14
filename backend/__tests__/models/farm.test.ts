"use strict";


import Farm from "../../models/farm";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";
import { NotFoundError } from "../../expressError";
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