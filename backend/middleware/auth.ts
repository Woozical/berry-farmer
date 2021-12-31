"use strict";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config";
import { UnauthorizedError, ForbiddenError, BadRequestError } from "../expressError";
import type {Request, Response, NextFunction} from "express";
import Crop from "../models/crop";
import Farm from "../models/farm";

/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */
function authenticateJWT(req:Request, res:Response, next:NextFunction) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in.
 *
 * If not, raises Unauthorized.
 */
function ensureLoggedIn(req:Request, res:Response, next:NextFunction) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when request requires authenticated admin privs.
 * As a failsafe, also checks for login. As such, this middleware can be
 * used in lieu of, or used after, ensureLoggedIn on protected routes
 * Raises forbidden if not admin, and unauth on not loggged in
 */
function ensureAdmin(req:Request, res:Response, next:NextFunction) {
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    if (res.locals.user.isAdmin !== true) throw new ForbiddenError("This operation requires admin privileges.");
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware for users routes, provides authorization if logged in username matches
 * the username in the route. Admin users are also authorized to the route. Also checks
 * for login. As such, this middleware can be used in lieu of, or used after, ensureLoggedIn
 * on protected routes. Raises forbidden if username mismatch, and unauth on not logged in.
 */
function ensureSameUser(req:Request, res:Response, next:NextFunction) {
  try{
    if (!res.locals.user) throw new UnauthorizedError();
    if (res.locals.user.username !== req.params.username && res.locals.user.isAdmin !== true){
      throw new ForbiddenError("You do not have access to this operation.")
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to ensure that the request crop or farm is associated with the logged in user
 *  This function examines the request in the following order:
 *   1) isAdmin in JWT token (authorizes if true)
 *   2) cropID in request params
 *   3) cropID in request body
 *   4) farmID in request params
 *   5) farmID in request body
 *  It then checks to see that the entry on the farms table has owner which matches username in JWT token.
 *  Throws UnauthorizedError if not logged in.
 *  Throws ForbiddenError if no ownership association
 *  Throws BadRequestError if no crop or farm info in request
 */
async function ensureOwnedBy(req:Request, res:Response, next:NextFunction) {
  const fMsg = "You do not have access to this operation. (Not farm owner)"
  try {
    if (!res.locals.user) throw new UnauthorizedError();
    if (res.locals.user.isAdmin === true) return next();
    if (req.params.cropID){
      const cropID = Number(req.params.cropID);
      if (cropID !== cropID) throw new BadRequestError("Received non-numeric cropID when attempting to verify crop ownership.")
      const v = await Crop.checkOwnership(cropID, res.locals.user.username);
      if (!v) throw new ForbiddenError(fMsg)
    }
    else if (req.params.farmID || req.body.farmID){
      const farmID = Number(req.params.farmID) || Number(req.body.farmID);
      if (farmID !== farmID)throw new BadRequestError("Received non-numeric farmID when attempting to verify farm ownership.");
      const v = await Farm.checkOwnership(farmID, res.locals.user.username);
      if (!v) throw new ForbiddenError(fMsg)
    } else {
      throw new BadRequestError("No farm or crop id in request when attempting to verify ownership");
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

export {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureSameUser,
  ensureOwnedBy
};