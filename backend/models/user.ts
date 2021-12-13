import db from "../db";
import bcrypt from "bcrypt";
import { BadRequestError } from "../expressError";
import { BCRYPT_WORK_FACTOR } from "../config";

interface RegisterProps{
  username: string,
  email: string,
  password: string
}

export default class User {

  /** Registers user with given data
   *  Returns { username, email, funds }
   *  Throws BadRequestError on duplicate username and/or email
   */
  static async register({ username, email, password }:RegisterProps){
    const hashedPW = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    try {
      const result = await db.query(
        `INSERT INTO users (username, email, password)
         VALUES ($1, $2, $3)
         RETURNING username, email, funds`,
         [username, email, hashedPW]
      );
      const user = result.rows[0];
      user.funds = +user.funds;
      return user;
    } catch (err:any) {
      if (err.code && err.code === '23505'){
        const keyViolation = err.constraint.includes("username") ? `username: ${username}` : `email: ${email}`;
        throw new BadRequestError(`Bad Request: Duplicate ${keyViolation}`);
      }
      
      throw err;
    }
  }
}