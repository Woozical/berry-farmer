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
      moisture: 50,
      health: 100,
      curGrowthStage: 0,
      plantedAt: expect.any(Date),
      berry: {
        type: "cheri",
        growthTime: 3,
        maxHarvest: 5,
        size: 20,
        dryRate: 10,
        pokeType: 'fire',
        pokePower: 60,
        idealTemp: 90,
        idealCloud: 15
      },
      farmID: expect.any(Number),
      x: expect.any(Number),
      y: expect.any(Number)
    });
  });

  it("throws NotFoundError if invalid crop id", async () => {
    try {
      await Crop.get(-1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("Get berry profile method", () => {
  it("works", async () => {
    const berry = await Crop.getBerryProfile("cheri");
    expect(berry).toEqual({
      name: "cheri",
      dryRate: 10,
      growthTime: 3,
      idealCloud: 15,
      idealTemp: 90,
      maxHarvest: 5,
      pokePower: 60,
      pokeType: "fire",
      size: 20
    });
  });

  it("throws NotFoundError on invalid berry name", async () => {
    try {
      await Crop.getBerryProfile("idontexist");
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("Check ownership method", () => {
  it("works", async () => {
    const q = await db.query("SELECT id FROM crops WHERE berry_type = 'cheri' ");
    const { id:cropID } = q.rows[0];
    expect( await Crop.checkOwnership(cropID, 'u1') ).toEqual(true);
    expect( await Crop.checkOwnership(cropID, 'u2') ).toEqual(false);
    expect( await Crop.checkOwnership(cropID, 'idontexist') ).toEqual(false);
  });

  it("throws NotFoundError on invalid crop ID", async () => {
    try {
      await Crop.checkOwnership(-1, "u1");
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("Calculate new health method", () => {
  it("calculates moisture health adjustment correctly", () => {
    const params = { health: 0, avgTemp: 0, avgCloud: 0, idealTemp: 100, idealCloud: 100 };
    expect(Crop.calcHealth({...params, moisture: 100 })).toEqual(25);
    expect(Crop.calcHealth({...params, moisture: 80 })).toEqual(5);
    expect(Crop.calcHealth({...params, moisture: 75 })).toEqual(0);
  });

  it("calculates weather modifiers correctly", () => {
    const params = {health: 10, moisture: 75};
    expect(Crop.calcHealth({...params, idealTemp: 1, idealCloud: 1, avgCloud: 1, avgTemp: 1}))
    .toBeCloseTo(13.5);
    expect(Crop.calcHealth({...params, idealTemp: 0, avgTemp: 5.16, idealCloud: 0, avgCloud: 15.03}))
    .toBeCloseTo(10);
    expect(Crop.calcHealth({...params, idealTemp: 100, avgTemp: -20, idealCloud: 1, avgCloud: 50 }))
    .toEqual(0);
  });

  it("accumulates all factors correctly", () => {
    const params = { health: 10, moisture: 100 };
    expect(Crop.calcHealth({...params, idealTemp: 0, avgTemp: 5.16, idealCloud: 0, avgCloud: 15.03}))
    .toBeCloseTo(35, 1);
    expect(Crop.calcHealth({...params, idealTemp: 1, avgTemp: 1, idealCloud: 1, avgCloud: 1}))
    .toBeCloseTo(13.5+25);
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

    expect(await Crop.calcMoisture(500, {moisture: 0, dryRate: 20})).toEqual(0);
  });

  it("throws BadRequestError if invalid prop configuration", async () => {
    // No props
    try {
      await Crop.calcMoisture(100, {});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
    // one missing prop
    try {
      await Crop.calcMoisture(100, {moisture: 30});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
    try {
      await Crop.calcMoisture(100, {dryRate: 100});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
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
      expect(err).toBeInstanceOf(NotFoundError);
    }
    // missing prop
    try {
      await Crop.calcMoisture(500, {cropID: -1, moisture: 50});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("Update method", () => {
  it("updates the db with given information", async () => {
    const q = await db.query("SELECT * FROM crops WHERE berry_type = 'chesto' ");
    const crop = q.rows[0];
    const res = await Crop.update(crop.id, {moisture: 45, health: 25, curGrowthStage: 1});
    
    // returns object with crop data
    expect(res).toEqual({
      id : crop.id,
      moisture: 45,
      health: 25,
      curGrowthStage: 1,
      plantedAt : expect.any(Date),
      berryType: "chesto",
      farmID : expect.any(Number),
      x: expect.any(Number),
      y: expect.any(Number),
    });
    
    // changes reflect in DB
    const qU = await db.query("SELECT * FROM crops WHERE id = $1", [crop.id]);
    const updated = qU.rows[0];
    expect(updated.moisture).toEqual("45");
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
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("delete method", () => {
  it("should delete crop from db", async () => {
    const q = await db.query("SELECT * FROM crops");
    const { id: cropID } = q.rows[0];
    const res = await Crop.delete(cropID);
    expect(res).toEqual({ deleted: cropID });

    const q2 = await db.query("SELECT * FROM crops WHERE id = $1", [cropID]);
    expect(q2.rowCount).toEqual(0);
  });

  it("should throw NotFoundError if invalid crop id", async () => {
    try {
      await Crop.delete(-1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
})

describe("create method", () => {
  it("should create new crop in db", async () => {
    const q = await db.query("SELECT * FROM farms");
    const { id:farmID } = q.rows[0];
    const res = await Crop.create({
      berryType: "cheri",
      farmID,
      farmX: 2,
      farmY: 2
    });
    expect(res).toEqual({
      id: expect.any(Number),
      berryType: "cheri",
      moisture: 0,
      health: 100,
      plantedAt: expect.any(Date),
      curGrowthStage: 0,
      farmID,
      x: 2,
      y: 2
    });
    // changes reflect in database
    const n = await db.query("SELECT * FROM crops WHERE id = $1", [res.id]);
    expect(n.rows[0].farm_id).toEqual(res.farmID);
    expect(n.rows[0].farm_x).toEqual(res.x);
    expect(n.rows[0].farm_y).toEqual(res.y);

    // works with curGrowthStage override
    const res2 = await Crop.create({
      berryType: "cheri",
      farmID,
      farmX: 2,
      farmY: 1,
      curGrowthStage: 2
    });
    expect(res2.curGrowthStage).toEqual(2);
  });

  it("throws BadRequestError on dupe farm coords", async () => {
    const q = await db.query("SELECT * FROM farms WHERE owner = 'u1'");
    const { id:farmID } = q.rows[0];
    try {
      await Crop.create({berryType: "cheri", farmID, farmX: 0, farmY: 0});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if coords excede given farm's length / width", async () => {
    const q = await db.query("SELECT * FROM farms");
    const {id : farmID} = q.rows[0];
    try {
      await Crop.create({berryType: "cheri", farmID, farmX: 99, farmY: 99});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError on invalid berry type", async () => {
    const q = await db.query("SELECT * FROM farms WHERE owner = 'u1'");
    const { id:farmID } = q.rows[0];
    try {
      await Crop.create({berryType: "dontexist", farmID, farmX: 9, farmY: 9});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError on invalid farm ID", async () => {
    try {
      await Crop.create({berryType: "cheri", farmID: -1, farmX: 99, farmY: 99});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("harvest method", () => {
  let cropID:number, berryType:string, owner:string;
  beforeAll( async () => {
    const q = await db.query(
      `SELECT crops.id, crops.berry_type AS "berryType", farms.owner
      FROM crops 
      JOIN farms ON crops.farm_id = farms.id
      ORDER BY crops.id
      LIMIT 1
      `);
    cropID = q.rows[0].id;
    owner = q.rows[0].owner;
    berryType = q.rows[0].berryType;
  });

  it("works, full health", async () => {
    await db.query(`UPDATE crops SET cur_growth_stage = 4 WHERE id = $1`, [cropID]);
    const res = await Crop.harvest(cropID);
    expect(res.amount).toEqual(5);
    expect(res.berryType).toEqual(berryType);
    // changes reflect in db
    let q = await db.query(`SELECT * FROM crops WHERE id = $1`, [cropID]);
    expect(q.rowCount).toEqual(0);
    q = await db.query(`SELECT amount FROM user_inventories WHERE username = $1 AND berry_type = $2`, [owner, berryType]);
    expect(q.rows[0].amount).toEqual(6);
  });

  it("works, half health", async () => {
    await db.query(`UPDATE crops SET cur_growth_stage = 4, health = 50 WHERE id = $1`, [cropID]);
    const res = await Crop.harvest(cropID);
    expect(res.amount).toEqual(2);
    expect(res.berryType).toEqual(berryType);
    // changes reflect in db
    let q = await db.query(`SELECT * FROM crops WHERE id = $1`, [cropID]);
    expect(q.rowCount).toEqual(0);
    q = await db.query(`SELECT amount FROM user_inventories WHERE username = $1 AND berry_type = $2`, [owner, berryType]);
    expect(q.rows[0].amount).toEqual(3);
  });

  it("works, no health", async () => {
    await db.query(`UPDATE crops SET cur_growth_stage = 4, health = 0 WHERE id = $1`, [cropID]);
    const res = await Crop.harvest(cropID);
    expect(res.amount).toEqual(0);
    expect(res.berryType).toEqual(berryType);
    // changes reflect in db
    let q = await db.query(`SELECT * FROM crops WHERE id = $1`, [cropID]);
    expect(q.rowCount).toEqual(0);
    q = await db.query(`SELECT amount FROM user_inventories WHERE username = $1 AND berry_type = $2`, [owner, berryType]);
    expect(q.rows[0].amount).toEqual(1);
  });

  it("throws BadRequestError if not at max growth stage", async () => {
    try {
      await Crop.harvest(cropID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws NotFoundError if no such crop with given ID", async () => {
    try {
      await Crop.harvest(-1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  })
});
