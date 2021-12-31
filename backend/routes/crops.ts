"use strict";
import express from "express";
import Crop from "../models/crop";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import cropAdminPatch from "../schemas/cropAdminPatch.json";
import cropCreate from "../schemas/cropCreate.json";
import { authenticateJWT, ensureLoggedIn, ensureOwnedBy, ensureAdmin } from "../middleware/auth";
import { checkNumericParams } from "../middleware/params";
import { BadRequestError, ForbiddenError } from "../expressError";
import User from "../models/user";

const router = express.Router();

router.post("/:cropID/harvest", checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
  try {
    const harvest = await Crop.harvest(Number(req.params.cropID));
    return res.json({ message: "ok", harvest });
  } catch (err) {
    return next(err);
  }
});

// router.post("/:cropID/water", checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
//   try {
    
//   } catch (err) {

//   }
// });

router.route("/:cropID")
  .get(checkNumericParams, async (req, res, next) => {
    try {
      const crop = await Crop.get(Number(req.params.cropID));
      return res.json({ message: "ok", crop });
    } catch (err) {
      return next(err);
    }
  })
  .patch(checkNumericParams, authenticateJWT, ensureAdmin, async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, cropAdminPatch);
      if (!validator.valid){
        throw invalidBadRequest(validator);
      }
      const crop = await Crop.update(Number(req.params.cropID), req.body);
      return res.json({ message: "updated", crop });
    } catch (err) {
      return next(err);
    }
  })
  .delete(checkNumericParams, authenticateJWT, ensureOwnedBy, async (req, res, next) => {
    try {
      const result = await Crop.delete(Number(req.params.cropID));
      return res.json({...result, message: "ok" });
    } catch (err) {
      return next(err);
    }
  });

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
      throw new BadRequestError(`No ${berryType} berry in ${res.locals.user.username}'s inventory to plant`);
    }
    const crop = await Crop.create({ farmX, farmY, farmID, berryType, curGrowthStage: req.body.curGrowthStage });
    return res.status(201).json({ message: "created", crop });
  } catch (err) {
    return next(err);
  }
});

export default router;