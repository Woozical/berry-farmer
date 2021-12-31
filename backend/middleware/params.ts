import { BadRequestError } from "../expressError";
import type {Request, Response, NextFunction} from "express";

/** Checks if the given URL parameters are castable to a numeric type.
 *  If not, throws 400 BadRequest Error.
 *  This middleware should be used when all parameters in the route
 *  are expected to be numbers, generally because they are integer IDs (e.g. /farms/:farmID).
 * 
 *  If routes with mixed-type parameters are used in the future, this can be repurposed to check the key contains ID,
 *  and then make sure that all routes use ID in their parameter names when expected to be numeric.
 */
 function checkNumericParams(req:Request, res:Response, next:NextFunction) {
  try {
    for (let key of Object.keys(req.params)){
      if (Number(req.params[key]) !== Number(req.params[key])){
        throw new BadRequestError(`URL parameter ${key} must be of numeric type.`);
      }
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

export { checkNumericParams };