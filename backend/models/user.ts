import db from "../db";
import bcrypt from "bcrypt";
import { BadRequestError, NotFoundError, UnauthorizedError } from "../expressError";
import { BCRYPT_WORK_FACTOR } from "../config";
import { sqlForPartialUpdate } from "../utils/sql";

interface RegisterProps{
  username: string,
  email: string,
  password: string
}

interface UpdateProps{
  email?: string,
  funds?: number
}

export default class User {

  /** Finds user with given username in database
   *  Returns { username, funds, farmCount } if hideSensitive=true, { username, email, funds, farmCount } if hideSensitive=false
   *  Throws NotFoundError if no user with such username
   */
  static async get(username:string, hideSensitive:boolean=true){
    const result = await db.query(
      `SELECT username, count(farms.id) AS "farmCount", funds ${hideSensitive ? '' : ', email'}
       FROM users
       FULL JOIN farms ON farms.owner = users.username
       WHERE username = $1
       GROUP BY username`, [username]
    );
    if (result.rowCount < 1) throw new NotFoundError(`No user with username ${username}`);

    return {...result.rows[0], farmCount: Number(result.rows[0].farmCount), funds: Number(result.rows[0].funds)};
  }

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
      
      return {...result.rows[0], funds: Number(result.rows[0].funds)};
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
    if (result.rowCount < 1) throw new NotFoundError(`No user with username ${username}`);

    const auth = await bcrypt.compare(password, result.rows[0].password);
    if (auth) {
      const user = {...result.rows[0], funds: Number(result.rows[0].funds)};
      delete user.password;
      return user;
    }
    throw new UnauthorizedError();
  }

  /** Updates user with given username and data
   *  Returns object with updated user data
   *  Throws NotFoundError if no matching username
   *  
   *  SECURITY RISK: The interface of the data param is checked by Typescript, which does not validate at runtime.
   *  Therefore, data should be passed to this method explicitly, or requests should be validated via a schema before
   *  calling this method, as this method will update any fields in the data param.
   *  --
   *  GOOD: User.update("johndoe", { funds: req.body.funds, email: req.body.email });
   *  BAD: User.update("johndoe", req.body); OR User.update("johndoe", {...req.body});
   */
  static async update(username: string, newData:UpdateProps){
    const { values, setCols } = sqlForPartialUpdate(newData);
    const result = await db.query(
      `UPDATE users SET ${setCols} WHERE username = $${values.length+1}
       RETURNING username, email, funds`, [...values, username]
    );
    if (result.rowCount < 1) throw new BadRequestError(`No user with username ${username}`);
    return {...result.rows[0], funds : Number(result.rows[0].funds)};
  }

  /** Private helper methods for UPDATE and INSERT operations on user_inventories table */
  private static async invBerryInsert(username: string, berryType: string, amount: number){
    const res = await db.query(
      `INSERT INTO user_inventories (username, berry_type, amount)
       VALUES ($1, $2, $3)`, [username, berryType, amount]
    );
    return res;
  };

  private static async invBerryUpdate(username: string, berryType: string, amount: number){
    const res = await db.query(
      `UPDATE user_inventories
       SET amount = (amount + $1)
       WHERE username = $2 AND berry_type = $3`,
       [amount, username, berryType]
    );
    return res;
  }

  /** Increments by provided amount for user and berry type on user_inventories table.
   *  Amount must be positive. Performs UPDATE if row already exists. INSERTs if not.
   *  Throws BadRequestError on non-positive amount or bad foreign keys.
   * */
  static async addBerry(username: string, berryType: string, amount: number){
    if (amount < 0) throw new BadRequestError("Berry amount must be positive.");
    try {
      const res = await User.invBerryUpdate(username, berryType, amount);
      if (res.rowCount < 1) await User.invBerryInsert(username, berryType, amount);
    } catch (err:any) {
      if (err.code && err.code === '23503'){
        const msg = err.constraint.includes('berry_type') ?
                      `Invalid berry type ${berryType}` : `Invalid username ${username}`;
        throw new BadRequestError(msg);
      }
      throw err;
    }
  }
  /** Decrements by provided amount for user and berry type on user_inventories table.
   *  Amount must be negative. Provided amount can not drop the db's amount below zero.
   *  Throws BadRequestError on non-negative amount, excessive amount, or bad foreign keys.
   * */
  static async deductBerry(username:string, berryType:string, amount: number){
    if (amount > 0) throw new BadRequestError("Berry amount must be negative");
    try {
      const res = await User.invBerryUpdate(username, berryType, amount);
      if (res.rowCount < 1) throw new BadRequestError(`Invalid username ${username} or berryType ${berryType}`);
    } catch (err:any) {
      if (err instanceof BadRequestError) throw err
      else if (err.constraint && err.constraint === 'positive_amount'){
        const d = err.detail.lastIndexOf('-');
        const p = err.detail.lastIndexOf(')');
        const n = Number(err.detail.slice(d+1, p))
        throw new BadRequestError(`Final amount may not be below zero. Try deducting by ${Math.abs(amount) - n} `);
      }
    }
  }
}