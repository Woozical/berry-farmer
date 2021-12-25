"use strict";

import jwt from "jsonwebtoken";
import { SECRET_KEY } from "../config";

interface UserObject {
  username: string
  isAdmin: boolean
  funds?: number
  email?: string
}

/** return signed JWT from user data. */

export function createToken(user:UserObject) {
  const payload = {
    username: user.username,
    funds: user.funds || 0,
    isAdmin: user.isAdmin || false
  };

  return jwt.sign(payload, SECRET_KEY);
}