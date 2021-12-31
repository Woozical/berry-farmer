"use strict";
import express from "express";
import Market from "../models/market";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import berryMarketOrder from "../schemas/berryMarketOrder.json";
import { authenticateJWT, ensureLoggedIn } from "../middleware/auth";
import app from "../app";
import Crop from "../models/crop";

const router = express.Router();

/** GET /berries/prices
 *  Responds with the full list of current berry prices, as well as currently hot/not pokemon types
 */
router.get("/prices", async (req, res, next) => {
  try {
    // convert price map to POJO
    const prices = {};
    for (let [berryType, price] of app.locals.marketPrices){
      //@ts-ignore
      prices[berryType] = price;
    }
    return res.json({
      message: "ok",
      prices, 
      hot: Array.from(app.locals.marketMods.hot), 
      not: Array.from(app.locals.marketMods.not)
    });
  } catch (err) {
    return next(err);
  }
});

/** GET /berries/:berryType
 *  Responds with the berry profile information of a given berry type, with current market prices added in.
 */
router.get("/:berryType", async (req, res, next) => {
  try {
    const berry = await Crop.getBerryProfile(req.params.berryType);
    return res.json({ message: "ok", berry: {...berry, price: app.locals.marketPrices.get(berry.name)} });
  } catch (err) {
    return next(err);
  }
});

/** POST /berries/sell (Must be logged in)
 *  -> { berryType, amount }
 *  { message: "Sold X berryType berries for $Y", sellOrderPrice } <-
 *  
 *  Attempts to sell an amount of given berryType from the logged in user's inventory.
 */
router.post("/sell", authenticateJWT, ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, berryMarketOrder);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }
    const { amount, berryType } = req.body;
    const price = app.locals.marketPrices.get(berryType);
    const result = await Market.sellBerry(res.locals.user.username, berryType, price, amount);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

/** POST /berries/buy (Must be logged in)
 *  -> { berryType, amount }
 *  { message: "Bought X berryType berries for $Y", buyOrderPrice } <-
 * 
 *  Attempts to purchase an amount of given berryType and add to logged in user's inventory.
 */
router.post("/buy", authenticateJWT, ensureLoggedIn, async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, berryMarketOrder);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }
    const { amount, berryType } = req.body;
    const price = app.locals.marketPrices.get(berryType);
    const result = await Market.purchaseBerry(res.locals.user.username,berryType, price, amount);
    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
});

export default router;