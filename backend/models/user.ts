import db from "../db";
import bcrypt from "bcrypt";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../expressError";
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
      const user = {...result.rows[0]};
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

  /** Attempts to authenticate with given credentials
   *  If password is valid, returns object with user data
   *  Throws UnauthorizedError on bad password
   *  Throws NotFoundError if no matching username
   */
  static async authenticate(username:string, password:string){
    const result = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
    if (result.rows.length < 1) throw new NotFoundError(`No user with username ${username}`);

    const auth = await bcrypt.compare(password, result.rows[0].password);
    if (auth) {
      const user = {...result.rows[0]};
      user.funds = +user.funds;
      delete user.password;
      return user;
    }
    throw new UnauthorizedError();
  }
}