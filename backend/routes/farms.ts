"use strict";
import express from "express";
import Farm from "../models/farm";
import Market from "../models/market";
import Crop from "../models/crop";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import farmBuySchema from "../schemas/farmBuy.json";
import farmUpgradeSchema from "../schemas/farmUpgrade.json";
import farmAdminCreateSchema from "../schemas/farmAdminCreate.json";
import farmAdminPatchSchema from "../schemas/farmAdminPatch.json";
import { authenticateJWT, ensureAdmin, ensureLoggedIn, ensureOwnedBy } from "../middleware/auth";
import { checkNumericParams } from "../middleware/params";
import { BadRequestError } from "../expressError";
import { FARM_SYNC_TIMER } from "../config";

const router = express.Router();

/** Checks for neglected crops to delete prior to handling request */
router.use(async (req, res, next) => {
  await Crop.cleanup();
  return next();
});

/** POST /farms (Admin Only)
 *  Creates a new farm with the given properties. Users should create farms through the /farms/buy route.
 *  -> { locationID, owner, length?, width?, irrigationLVL? }
 *  <- { message: "created", farm: { id, length, width, irrigationLVL, lastCheckedAt, locationID, owner } }
 */
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

/** POST /farms/buy (loggedIn) 
 *  Creates a new farm associated to the logged in user. User should have requisite funds or a BadRequestError will be raised.
 *  Cost of a farm is defined in the Market model, those funds will then be deducted by the user upon creation.
 *  -> { locationID }
 *  <- { message: "ok", farm: { id, length, width, irrigationLVL, lastCheckedAt, locationID, owner } }
 */
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
  /** GET /farms/:farmID (loggedIn)
   *  Returns farm information for the given farm ID. If an amount of time has passed the FARM_SYNC_TIMER (defined in config.ts)
   *  Then the server will respond with a 211 code, meaning that the user must send a POST to /farms/:farmID/sync before that
   *  resource is available for viewing.
   *  
   *  200: <- { message: "ok", farm: {
   *            id, length, width, irrigationLVL, lastCheckedAt,
   *            locationName, locationRegion, locationCountry, crops: [...]
   *            } 
   *          }
   */
  .get(checkNumericParams, authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
      const farmID = Number(req.params.farmID);
      const farm = await Farm.get(farmID);
      /** If 10 minutes have passed since last crop sync, resource must be updated before being accessed */
      if (farm.crops.length > 0 && Date.now() - farm.lastCheckedAt.getTime() > FARM_SYNC_TIMER){
        return res.status(211).json({ message: `needs crop sync. send POST request to /farms/${farmID}/sync` });
      }
      return res.json({ message: "ok", farm });
    } catch (err) {
      return next(err);
    }
  })
  /** PATCH /farms/:farmID (Admin Only) 
   *  Modifies the information of the farm with the given farm ID. Users should use /farms/:farmID/upgrade.
   *  -> { length?, width?, irrigationLVL? }
   *  <- { message: "updated", farm: { id, length, width, irrigationLVL, lastCheckedAt, locationID, owner } }
   */
  .patch(checkNumericParams, authenticateJWT, ensureAdmin, async (req, res, next) => {
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
  /** DELETE /farms/:farmID (Owner Only) 
   *  Deletes the farm, and all associated crops, with the given farm ID.
   */
  .delete(checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
    try {
      const result = await Farm.delete(Number(req.params.farmID));
      return res.json({ ...result, message: "ok" });
    } catch (err) {
      return next(err);
    }
  });

/** POST /farms/:farmID/sync (Owner Only)
 *  Performs a crop sync operation on the given farm. All crops associated with the farm
 *  have time delta-based operations performed on them, updating their moisture and possibly, health
 *  and curGrowthStage. This operation requires weather data, and may query WeatherAPI for weather data
 *  on the farm's location if it does not already exist for the requisite dates to check.
 *  Once finished, the farm's lastCheckedAt is updated to the time this operation took place, and the server
 *  responds with the updated farm object similar to GET /farms/:farmID
 */
router.post("/:farmID/sync", checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
  try {
    const farmID = Number(req.params.farmID);
    await Farm.syncCrops(farmID);
    const farm = await Farm.get(farmID);
    return res.json({ message: "updated", farm });
  } catch (err) {
    return next(err);
  }
});

/** POST /farms/:farmID/upgrade (Owner Only)
 *  Increases the length, width, or irrigationLVL of the farm with the given id by 1.
 *  The owner of the farm must have the requisite funds for the upgrade (defined in Market model) or a BadRequest will
 *  be thrown. Those funds will then be deducted from the user.
 * 
 *  -> { type: "irrigation" OR "length" OR "width" }
 *  <- { message: "updgraded", farm: { id, length, width, irrigationLVL, lastCheckedAt, locationID, owner } }
 */
router.post("/:farmID/upgrade", checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
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

export default router;