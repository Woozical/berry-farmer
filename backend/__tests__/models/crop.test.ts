"use strict";


import Crop from "../../models/crop";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";
import { NotFoundError } from "../../expressError";
import db from "../../db";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("Get method", () => {
  it("returns an object with crop data matching DB", async () => {
    const q = await db.query("SELECT * FROM crops WHERE berry_type = 'cheri' ");
    const crop = q.rows[0];
    const res = await Crop.get(crop.id);
    expect(res).toEqual({
      id: crop.id,
      moisture: 0,
      health: 100,
      curGrowthStage: 0,
      plantedAt: expect.any(Date),
      berryType: "cheri",
      farmID: expect.any(Number),
      farmX: expect.any(Number),
      farmY: expect.any(Number)
    });
  });

  it("throws NotFoundError if invalid crop id", async () => {
    try {
      await Crop.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
  });
});

describe("Update method", () => {
  it("updates the db with given information", async () => {
    const q = await db.query("SELECT * FROM crops WHERE berry_type = 'chesto' ");
    const crop = q.rows[0];
    const res = await Crop.update(crop.id, {moisture: 50, health: 25, curGrowthStage: 1});
    
    // returns object with crop data
    expect(res).toEqual({
      id : crop.id,
      moisture: 50,
      health: 25,
      curGrowthStage: 1,
      plantedAt : expect.any(Date),
      berryType: "chesto",
      farmID : expect.any(Number),
      farmX: expect.any(Number),
      farmY: expect.any(Number),
    });
    
    // changes reflect in DB
    const qU = await db.query("SELECT * FROM crops WHERE id = $1", [crop.id]);
    const updated = qU.rows[0];
    expect(updated.moisture).toEqual("50");
    expect(updated.health).toEqual("25");
    expect(updated.cur_growth_stage).toEqual(1);

    // no changes in immutable fields
    expect(crop.planted_at).toEqual(updated.planted_at);
    expect(crop.farm_id).toEqual(updated.farm_id);
    expect(crop.farm_x).toEqual(updated.farm_y);
    expect(crop.berry_type).toEqual(updated.berry_type);
  });

  it("throws NotFoundError if invalid crop id", async () => {
    try {
      await Crop.update(-1, { moisture: 500 })
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
  });
});
