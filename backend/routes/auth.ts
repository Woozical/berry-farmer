"use strict";
import express from "express";
import User from "../models/user";
import { createToken } from "../utils/token";
import jsonschema from "jsonschema";
import { invalidBadRequest } from "../utils/helpers";
import userLoginSchema from "../schemas/userLogin.json";
import userRegisterSchema from "../schemas/userRegister.json";

const router = express.Router();

/** POST /auth/login: { username, password } => { token }
 *  
 *  Returns JSON Web Token which can be used to authenticate future requests.
 *  Auth required: None
 */
router.post("/login", async (req, res, next) => {
  try {
    const validator = jsonschema.validate(req.body, userLoginSchema);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }

    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json( {token} );
  } catch (err) {
    next(err);
  }
});

/** POST /auth/register:   { user } => { token }
 *  user must include { username, password, email }
 *
 *  Returns JWT token which can be used to authenticate further requests.
 *  Auth required: none
 */

 router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userRegisterSchema);
    if (!validator.valid) {
      throw invalidBadRequest(validator);
    }

    const newUser = await User.register({ ...req.body });
    const token = createToken(newUser);
    return res.status(201).json({ token });
  } catch (err) {
    return next(err);
  }
});


export default router;