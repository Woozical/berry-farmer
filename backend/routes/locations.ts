"use strict"
import express from "express";
import GeoProfile from "../models/geoProfiles";
import { authenticateJWT, ensureAdmin, ensureLoggedIn } from "../middleware/auth";
import { checkNumericParams } from "../middleware/params";
import adminPatchSchema from "../schemas/geoProfileAdminPatch.json";
import createSchema from "../schemas/geoProfileCreate.json";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";

const router = express.Router();

router.route("/:locationID")
  /** GET /locations/:locationID
   *  Returns { id, name, region, country } of a given country
   */
  .get(checkNumericParams, async (req, res, next) => {
    try {
      const location = await GeoProfile.get(Number(req.params.locationID));
      return res.json({ message: "ok", location });
    } catch (err) {
      return next(err);
    }
  })
  /** PATCH /locations/:locationID (admin only)
   * 
   *  WARNING: geo_profiles are created using data pulled from the WeatherAPI, and are used for
   *  further communication with that API. Editing these fields in DB may have unintended consequences.
  */
  .patch(checkNumericParams, authenticateJWT, ensureAdmin, async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, adminPatchSchema);
      if (!validator.valid){
        throw invalidBadRequest(validator);
      }
      const location = await GeoProfile.update(Number(req.params.locationID), req.body);
      return res.json({ message: "updated", location });
    } catch (err) {
      return next(err);
    }
  })
  /** DELETE /locations/:locationID (admin only)
   *  Deletes the geo_profile with the given ID from the database. Be advised that said
   *  geo_profile must not be referenced by any existing farms, or a null foreign key violation
   *  will be triggered and a 400 response will be returned. Any farms that make reference to the
   *  geo_profile should be migrated to a different geo_profile before deletion of this geo_profile.
   */
  .delete(checkNumericParams, authenticateJWT, ensureAdmin, async (req, res, next) => {
    try {
      const result = await GeoProfile.delete(Number(req.params.locationID));
      return res.json({ message: "ok", ...result });
    } catch (err) {
      return next(err);
    }
  });

router.route("/")
  /** GET /locations
   *  Returns a list of geo_profiles, with pagination
   *  Filtering parameters and page offset can be sent as part of the query string to this route.
   *  Accepting query params: { name:string, region:string, country:string, page:number }
  */
  .get(async (req, res, next) => {
    try {
      // Remove unwanted params from query string for filtering
      const cleanParams = (({name, region, country}) => {
        const obj:any = {};
        if (name) obj.name = name;
        if (region) obj.region = region;
        if (country) obj.country = country;
        return obj;
      })(req.query);
      
      const page = Number(req.query.page) || 0;
      const locations = (Object.keys(cleanParams).length > 0) ?
                        await GeoProfile.filter(cleanParams, page) : await GeoProfile.getAll(page);
      
      return res.json({ message: "ok", locations, page });
    } catch (err) {
      return next(err);
    }
  })
  /** POST /locations  (logged in only)
   *  Creates a new geo_profile, using the search term provided in the payload to query WeatherAPI
   *  for location and weather data. If WeatherAPI responds to the search term with a location that
   *  is already present in the DB, a 400 response will be issued.
   *  => { search }
   * <= { id, name, region, country }
  */
  .post(authenticateJWT, ensureLoggedIn, async (req, res, next) => {
    try {
      const validator = jsonschema.validate(req.body, createSchema);
      if (!validator.valid) {
        throw invalidBadRequest(validator);
      }
      const location = await GeoProfile.create(req.body.search);
      return res.status(201).json({ message: "created", location });
    } catch (err) {
      return next(err);
    }
  });

export default router;