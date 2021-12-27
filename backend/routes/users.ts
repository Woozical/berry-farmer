"use strict";
import express from "express";
import User from "../models/user";
import Farm from "../models/farm";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import userAdminPatch from "../schemas/userAdminPatch.json";
import { authenticateJWT, ensureAdmin, ensureLoggedIn, ensureSameUser } from "../middleware/auth";

const router = express.Router();

// GET /users/:username (loggedIn, sameUser = hideSensitive is false)
router.get("/:username", authenticateJWT, ensureLoggedIn, async (req, res, next) => {
  try {
    const hideSensitive = (!res.locals.user.isAdmin && res.locals.user.username !== req.params.username);
    const user = await User.get(req.params.username, hideSensitive);
    return res.json({ user, message: "ok" });
  } catch (err) {
    return next(err);
  }
});

// GET /users/:username/farms (loggedIn)
router.get("/:username/farms", authenticateJWT, ensureLoggedIn, async (req, res, next) => {
  try {
    const farms = await Farm.getByOwner(req.params.username);
    return res.json({ farms, message: "ok" });
  } catch (err) {
    return next(err);
  }
});

// DELETE /user/:username (loggedIn, sameUser)
router.delete("/:username", authenticateJWT, ensureSameUser, async (req, res, next) => {
  try {
    const result = await User.delete(req.params.username);
    return res.json({...result, message: "ok" });
  } catch (err) {
    return next(err);
  }
});

// PATCH /user/:username
router.patch("/:username", authenticateJWT, ensureAdmin, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userAdminPatch);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }
    const user = await User.update(req.params.username, req.body);
    return res.json({ user, message: "ok" });
  } catch (err) {
    return next(err);
  }
});

export default router;