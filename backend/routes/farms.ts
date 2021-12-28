"use strict";
import express from "express";
import Farm from "../models/farm";
import Market from "../models/market";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import farmBuySchema from "../schemas/farmBuy.json";
import farmUpgradeSchema from "../schemas/farmUpgrade.json";
import farmAdminCreateSchema from "../schemas/farmAdminCreate.json";
import farmAdminPatchSchema from "../schemas/farmAdminPatch.json";
import { authenticateJWT, ensureAdmin, ensureLoggedIn, ensureOwnedBy, ensureSameUser } from "../middleware/auth";
import { BadRequestError } from "../expressError";

const router = express.Router();

// POST /farms (admin only)
router.post("/", authenticateJWT, ensureAdmin, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, farmAdminCreateSchema);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }
    const farm = await Farm.create({...req.body});
    return res.status(201).json({ message: "created", farm });
  } catch (err) {
    return next(err);
  }
});

// POST /farms/buy (loggedIn)
// -> { locationID }
// { farm } <-
router.post("/buy", authenticateJWT, ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, farmBuySchema);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }
    const result = await Market.purchaseFarm(res.locals.user.username, req.body.locationID);
    return res.status(201).json({message: "ok", farm: result });
  } catch (err) {
    return next(err);
  }
});

router.route('/:farmID')
  .get(authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
      const farmID = Number(req.params.farmID);
      const farm = await Farm.get(farmID);
      /** If 10 minutes have passed since last crop sync, resource must be updated before being accessed */
      if (Date.now() - farm.lastCheckedAt.getTime() > 600000){
        return res.status(211).json({ message: `needs crop sync. send POST request to /farms/${farmID}/sync` });
      }
      return res.json({ message: "ok", farm });
    } catch (err) {
      return next(err);
    }
  })
  .patch(authenticateJWT, ensureAdmin, async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, farmAdminPatchSchema);
      if (!validator.valid){
        throw invalidBadRequest(validator);
      }
      const farm = await Farm.update(Number(req.params.farmID), req.body);
      return res.json({ message: "updated", farm });
    } catch (err) {
      return next(err);
    }
  })
  .delete(authenticateJWT, ensureOwnedBy, async (req, res, next) => {
    try {
      const result = await Farm.delete(Number(req.params.farmID));
      return res.json({ ...result, message: "ok" });
    } catch (err) {
      return next(err);
    }
  });

// POST /farms/:farmID/sync (loggedIn, ownedBy)
router.post("/:farmID/sync", authenticateJWT, ensureOwnedBy, async (req, res, next) => {
  try {
    const farmID = Number(req.params.farmID);
    await Farm.syncCrops(farmID);
    const farm = await Farm.get(farmID);
    return res.json({ message: "updated", farm });
  } catch (err) {
    console.log(err);
    return next(err);
  }
});

// POST /farms/:farmID/upgrade (loggedIn, ownedBy)
// - > { type : "irrigation" OR "length" OR "width" }
router.post("/:farmID/upgrade", authenticateJWT, ensureOwnedBy, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, farmUpgradeSchema);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }
    const { username } = res.locals.user;
    const farmID = Number(req.params.farmID);
    let upgradedFarm;
    switch (req.body.type){
      case "irrigation":
        upgradedFarm = await Market.upgradeFarmIrrigLVL(username, farmID);
        break;
      case "length":
        upgradedFarm = await Market.upgradeFarmDimensions(username, farmID, { length: 1, width: 0});
        break;
      case "width":
        upgradedFarm = await Market.upgradeFarmDimensions(username, farmID, { length: 0, width: 1 });
        break;
      default:
        throw new BadRequestError();
    }
    return res.json({ message: "upgraded", farm: upgradedFarm });
  } catch (err) {
    return next(err);
  }
});

// PATCH /farms/:farmID (admin only)


export default router;