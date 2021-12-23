"use strict";

import Market from "../../models/market";
import { BadRequestError } from "../../expressError";
import { commonAfterAll, commonAfterEach, commonBeforeAll, commonBeforeEach } from "./_testCommon";
import db from"../../db";

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("upgrade farm length/width", () => {
  beforeAll( async () => {
    await db.query("UPDATE users SET funds=9999 WHERE username = 'u1' ");
  });

  it("works", async () => {
    let q = await db.query("SELECT id, length, width FROM farms WHERE owner = 'u1' ");
    const { id: farmID, length, width } = q.rows[0];
    await Market.upgradeFarmDimensions("u1", farmID, { length: 1, width: 1 });

    // changes reflect in db
    q = await db.query("SELECT length, width FROM farms WHERE id = $1", [farmID]);
    expect(q.rows[0].length).toEqual(length+1);
    expect(q.rows[0].width).toEqual(width+1);
    q = await db.query("SELECT funds FROM users WHERE username = 'u1' ");
    expect(Number(q.rows[0].funds)).toBeCloseTo(
      9999 - (Market.LW_PRICE * 8)
    );
  });

  it("throws BadRequestError if given user is not farm owner", async () => {
    const q = await db.query("SELECT id FROM farms WHERE owner = 'u2' ");
    const { id: farmID } = q.rows[0];
    try {
      await Market.upgradeFarmDimensions("u1", farmID, { length: 0, width: 1});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if not enough funds", async () => {
    const q = await db.query("SELECT id FROM farms WHERE owner = 'u2' ");
    const { id: farmID } = q.rows[0];
    try {
      await Market.upgradeFarmDimensions("u2", farmID, { length: 0, width: 1});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if excedes max length dimensions", async () => {
    let q = await db.query("SELECT id FROM farms WHERE owner = 'u1' ");
    const { id: farmID } = q.rows[0];
    await db.query("UPDATE farms SET length = 10 WHERE id = $1", [farmID]);
    try {
      await Market.upgradeFarmDimensions("u1", farmID, { length: 1, width: 0});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if excedes max width dimensions", async () => {
    let q = await db.query("SELECT id FROM farms WHERE owner = 'u1' ");
    const { id: farmID } = q.rows[0];
    await db.query("UPDATE farms SET width = 10 WHERE id = $1", [farmID]);
    try {
      await Market.upgradeFarmDimensions("u1", farmID, { length: 0, width: 1});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("upgrade irrigation level", () => {
  beforeAll( async () => {
    await db.query("UPDATE users SET funds=9999 WHERE username = 'u1' ");
  });

  it("works", async () => {
    let q = await db.query("SELECT * FROM farms WHERE owner = 'u1' ");
    const { id: farmID, irrigation_lvl } = q.rows[0];
    await Market.upgradeFarmIrrigLVL("u1", farmID);

    // changes reflect in db
    q = await db.query("SELECT irrigation_lvl FROM farms WHERE id = $1 ", [farmID]);
    expect(q.rows[0].irrigation_lvl).not.toEqual(irrigation_lvl);
    expect(q.rows[0].irrigation_lvl).toEqual(irrigation_lvl+1);
    q = await db.query("SELECT funds FROM users WHERE username = 'u1' ");
    expect(Number(q.rows[0].funds)).toEqual(9999 - Market.IRRIG_PRICE);
  });

  it("throws BadRequestError if given user is not owner of farm", async () => {
    const q = await db.query("SELECT id FROM farms WHERE owner = 'u2' ");
    const { id: farmID } = q.rows[0];
    try {
      await Market.upgradeFarmIrrigLVL('u1', farmID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if insufficient funds", async () => {
    const q = await db.query("SELECT id FROM farms WHERE owner = 'u2' ");
    const { id: farmID } = q.rows[0];
    try {
      await Market.upgradeFarmIrrigLVL('u2', farmID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if irrigation lvl is maxed", async () => {
    const q = await db.query("SELECT id FROM farms WHERE owner = 'u1' ");
    const { id: farmID } = q.rows[0];
    await db.query("UPDATE farms SET irrigation_lvl = 5 WHERE id = $1 ", [farmID]);
    try {
      await Market.upgradeFarmIrrigLVL('u1', farmID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("purchase farm", () => {
  let locationID:number;
  beforeAll( async () => {
    await db.query(
      `UPDATE users SET funds = 9999 WHERE username = 'u1' OR username = 'u3' `
    );
    const q = await db.query('SELECT * FROM geo_profiles');
    locationID = q.rows[0].id;
  });

  it("successfully creates a farm and returns farm data obj", async () => {
    const res = await Market.purchaseFarm('u3', locationID);
    expect(res).toEqual({
      id: expect.any(Number),
      width: 3,
      length: 3,
      owner: 'u3',
      lastCheckedAt: expect.any(Date),
      irrigationLVL: 0,
      locationID
    });
    // changes reflect in db
    let q = await db.query("SELECT funds FROM users WHERE username = 'u3' ");
    expect(Number(q.rows[0].funds)).toEqual(9999 - Market.PLOT_PRICE);
    q = await db.query("SELECT * FROM farms WHERE id = $1", [res.id]);
    expect(q.rowCount).toEqual(1);
  });

  it("throws BadRequestError if insufficient funds", async () => {
    try {
      await Market.purchaseFarm('u2', locationID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if invalid username", async () => {
    try {
      await Market.purchaseFarm('idontexist', locationID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if invalid location id", async () => {
    try {
      await Market.purchaseFarm('u1', -1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });

  it("throws BadRequestError if user it as maximum farm plots", async () => {
    try {
      await Market.purchaseFarm('u1', locationID);
      await Market.purchaseFarm('u1', locationID);
      await Market.purchaseFarm('u1', locationID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});