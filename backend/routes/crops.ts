"use strict";
import express from "express";
import Crop from "../models/crop";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import cropAdminPatch from "../schemas/cropAdminPatch.json";
import cropOwnerPatch from "../schemas/cropOwnerPatch.json";
import cropCreate from "../schemas/cropCreate.json";
import { authenticateJWT, ensureOwnedBy } from "../middleware/auth";
import { checkNumericParams } from "../middleware/params";
import { BadRequestError, ForbiddenError } from "../expressError";
import User from "../models/user";
import Farm from "../models/farm";
import { FARM_SYNC_TIMER } from "../config";

const router = express.Router();

router.use(async (req, res, next) => {
  if (process.env.NODE_ENV !== "test") console.log("Checking for crop cleanup...");
  await Crop.cleanup();
  return next();
});

/** POST /crops/:cropID/harvest (Farm owner only)
 *  If given crop is at max growth, calculates # of berries harvested and adds it to farm owner's inventory
 *  The crop with this ID is then deleted.
 *  Responds with harvest => { amount, berryType }
 */
router.post("/:cropID/harvest", checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
  try {
    const harvest = await Crop.harvest(Number(req.params.cropID));
    return res.json({ message: "ok", harvest });
  } catch (err) {
    return next(err);
  }
});

router.route("/:cropID")
  /** GET /crops/:cropID (No auth)
   *  Returns information for the crop with the given ID
   */
  .get(checkNumericParams, async (req, res, next) => {
    try {
      const crop = await Crop.get(Number(req.params.cropID));
      return res.json({ message: "ok", crop });
    } catch (err) {
      return next(err);
    }
  })
  /** PATCH /crops/:cropID (Farm owner only) 
   *  Versatile endpoint, it behaves differently if it's being accessed by admin users.
   *  Admin users can patch crop moisture, growthStage and health.
   *  When patching moisture as admin, the moisture is SET TO the number specified in the payload.
   *  Admin => { moisture?, curGrowthStage?, health? } 
   *  { message: "updated", crop: { id, moisture, health, plantedAt, etc... } } <=
   * 
   *  If accessed by non-admin farm owners, the payload may only contain the moisture field.
   *  The number specified in the payload will be ADDED TO the crop's current moisture.
   *  Negative moisture amounts are not permitted.
   *  User => { moisture }
   * { message: "updated", crop: { id, moisture, health, plantedAt, etc... } } <=
   * 
   *  When accessed by non-admins, this route may respond 211 if the farm this crop exists on
   *  is in need of a sync. This is to prevent users from watering (neglected) crops prior to triggering a growth.
  */
  .patch(checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
    try {
      const schema = res.locals.user.isAdmin ? cropAdminPatch : cropOwnerPatch;
      const validator = jsonschema.validate(req.body, schema);
      if (!validator.valid){
        // See if user is attempting to patch as admin, if so, throw ForbiddenError instead of BadRequestError
        if (!res.locals.user.isAdmin && jsonschema.validate(req.body, cropAdminPatch).valid){
          throw new ForbiddenError("Must be admin to patch fields other than moisture on crops");
        }
        throw invalidBadRequest(validator);
      }
      const cropID = Number(req.params.cropID);
      // respond 211 if sync required, this is to prevent using PATCH to up moisture prior to checking neglected farm
      if (!res.locals.user.isAdmin){
        const crop = await Crop.get(cropID);
        const farm = await Farm.get(crop.farmID);
        if (Date.now() - farm.lastCheckedAt.getTime() > FARM_SYNC_TIMER){
          return res.status(211).json({ message: `Farm needs crop sync. Send POST request to /farms/${farm.id}/sync` });
        }
      }
      const crop = res.locals.user.isAdmin ? await Crop.update(cropID, req.body) : await Crop.water(cropID, req.body.moisture);
      return res.json({ message: "updated", crop });
    } catch (err) {
      return next(err);
    }
  })
  /** DELETE /crops/:cropID (Farm owner only)
   *  Removes the crop with the given ID from the database.
   */
  .delete(checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
    try {
      const result = await Crop.delete(Number(req.params.cropID));
      return res.json({...result, message: "ok" });
    } catch (err) {
      return next(err);
    }
  });

/** POST /crops (Farm owner only)
 *  This route creates new crops using data specified in the payload.
 *  The farmID in the payload is used for ownership auth.
 * 
 *  If the user hitting this route is not an admin, they must have a berry
 *  of the type specified in the payload in order to create the crop. One
 *  berry of that type is then removed from the user's inventory.
 * 
 *  If the user hitting this route is an admin, they may opt to manually set
 *  an initial growth stage of the crop. The server will respond with 403 Forbidden
 *  if a non-admin includes curGrowthStage in their payload, even  if all other fields are valid.
 * 
 *  => { x, y, farmID, berryType, curGrowthStage? }
 *  { message: "created", crop: { id, plantedAt, health, moisture, etc... } }
 */
router.post("/", authenticateJWT, ensureOwnedBy, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, cropCreate);
    if (!validator.valid){
      throw invalidBadRequest(validator);
    }
    if ("curGrowthStage" in req.body && !res.locals.user.isAdmin){
      throw new ForbiddenError("Only admins may set current growth stage on new crop.");
    }
    const user = await User.get(res.locals.user.username);
    const { x:farmX, y:farmY, farmID, berryType } = req.body;
    if (!res.locals.user.isAdmin && (!(berryType in user.inventory) || user.inventory[berryType] < 1)){
      throw new BadRequestError(`No ${berryType} berry in ${user.username}'s inventory to plant`);
    }
    const crop = await Crop.create({ farmX, farmY, farmID, berryType, curGrowthStage: req.body.curGrowthStage });
    if (!res.locals.user.isAdmin) await User.deductBerry(user.username, berryType, -1);
    return res.status(201).json({ message: "created", crop });
  } catch (err) {
    return next(err);
  }
});

export default router;