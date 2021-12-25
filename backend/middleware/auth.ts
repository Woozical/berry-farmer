"use strict";
import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config";
import { UnauthorizedError, ForbiddenError } from "../expressError";
import type {Request, Response, NextFunction} from "express";

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

/**
 * Middleware to use when request requires authenticated admin privs.
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

export {
  authenticateJWT,
  ensureLoggedIn,
  ensureAdmin,
  ensureSameUser
};