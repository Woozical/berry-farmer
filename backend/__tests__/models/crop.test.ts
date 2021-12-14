"use strict";
import Crop from "../../models/crop";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";
import { BadRequestError, NotFoundError } from "../../expressError";
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
      berry: {
        type: "cheri",
        growthTime: 3,
        maxHarvest: 5,
        size: '20',
        dryRate: 10,
        pokeType: 'fire',
        pokePower: 60,
        idealTemp: 90,
        idealCloud: 15
      },
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

describe("Calculate moisture level method", () => {
  it("works with crop ID lookup", async () => {
    // create control crop
    const fRes = await db.query("SELECT * FROM farms");
    const { id:farmID } = fRes.rows[0];
    const cRes = await db.query(
      `INSERT INTO crops (berry_type, moisture, farm_id, farm_x, farm_y)
                   VALUES ('pecha', 100, $1, 2, 2)
       RETURNING id`, [farmID]);
    const {id:cropID} = cRes.rows[0];
    // 100 Moisture after 2 hours (7200 seconds) with 15 dry rate should be near 70
    expect(await Crop.calcMoisture(7200, {cropID})).toBeCloseTo(70);
    // Ditto, works with given props if no cropID passed
    expect(await Crop.calcMoisture(7200, {moisture: 100, dryRate: 15})).toBeCloseTo(70);
    // Ditto, props from crop lookup supercede any props passed to function
    expect(await Crop.calcMoisture(7200, {cropID, moisture: 50, dryRate: 30})).toBeCloseTo(70);
    
    // 100 Moisture after 2hr 25min (8700 seconds) with 15 dry rate should be near 63.75
    expect(await Crop.calcMoisture(8700, {cropID})).toBeCloseTo(63.75);
  });

  it("throws BadRequestError if invalid prop configuration", async () => {
    // No props
    try {
      await Crop.calcMoisture(100, {});
      fail();
    } catch (err) {
      expect (err instanceof BadRequestError).toEqual(true);
    }
    // one missing prop
    try {
      await Crop.calcMoisture(100, {moisture: 30});
      fail();
    } catch (err) {
      expect (err instanceof BadRequestError).toEqual(true);
    }
    try {
      await Crop.calcMoisture(100, {dryRate: 100});
      fail();
    } catch (err) {
      expect (err instanceof BadRequestError).toEqual(true);
    }
  });

  it("does not throw NotFoundError if crop is invalid, but valid calc props are present", async () => {
    expect(await Crop.calcMoisture(7200, {cropID: -1, moisture: 100, dryRate: 15})).toBeCloseTo(70);
  });

  it("thows NotFoundError if crop id is invalid and no backup props", async () => {
    // no props
    try{
      await Crop.calcMoisture(500, {cropID: -1});
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toEqual(true);
    }
    // missing prop
    try {
      await Crop.calcMoisture(500, {cropID: -1, moisture: 50});
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
