import db from "../db";
import { BadRequestError, NotFoundError } from "../expressError";
import Farm from "./farm";
import User from "./user";

interface DimensionUpProps{
  length:number,
  width:number
}

const MAX_LENGTH = 10;
const MAX_WIDTH = 10;
const MAX_IRRIG = 5;
const MAX_PLOTS = 3;

export default class Market {
  static IRRIG_PRICE = 300;
  static PLOT_PRICE = 1000;
  static LW_PRICE = 100;

  static async upgradeFarmDimensions(username:string, farmID:number, {length, width}:DimensionUpProps){
    const q = await db.query(
      `SELECT farms.length, farms.width, users.funds
       FROM farms
       JOIN users ON farms.owner = users.username
       WHERE users.username = $1 AND farms.id = $2`,
       [username, farmID]
    );
    
    if (q.rowCount < 1) throw new BadRequestError(`No match between username ${username} and farm id ${farmID}`);
    if (q.rows[0].length + length > MAX_LENGTH || q.rows[0].width + width > MAX_WIDTH){
      throw new BadRequestError("Cannot upgrade past max dimensions");
    }
    const upgradePrice = (
      ((length + q.rows[0].length) * Market.LW_PRICE) +
      ((width + q.rows[0].width) * Market.LW_PRICE));

    if ( Number(q.rows[0].funds) < upgradePrice ){
      throw new BadRequestError(`${username} has insufficient funds for requested upgrades`);
    }

    await Farm.update(farmID, { length: length + q.rows[0].length, width: width + q.rows[0].width });
    await User.update(username, {funds: Number(q.rows[0].funds) - upgradePrice});
  }

  static async upgradeFarmIrrigLVL(username:string, farmID:number){
    const q = await db.query(
      `SELECT farms.irrigation_lvl, users.funds
       FROM farms
       JOIN users ON farms.owner = users.username
       WHERE users.username = $1 AND farms.id = $2`,
       [username, farmID]
    );
    if (q.rowCount < 1) throw new BadRequestError(`No match between username ${username} and farm id ${farmID}`);
    const upgradedIrrigLVL = q.rows[0].irrigation_lvl + 1;
    if (upgradedIrrigLVL > MAX_IRRIG){
      throw new BadRequestError("Cannot upgrade past max irrigation level");
    }
    const upgradePrice = (upgradedIrrigLVL * Market.IRRIG_PRICE);
    if ( Number(q.rows[0].funds) < upgradePrice ){
      throw new BadRequestError(`${username} has insufficient funds for requested upgrades`);
    }
    await Farm.update(farmID, {irrigationLVL: upgradedIrrigLVL});
    await User.update(username, {funds: Number(q.rows[0].funds) - upgradePrice});
  }

  static async purchaseFarm(username:string, locationID:number){
    let user;
    try {
      user = await User.get(username);
    } catch (err) {
      if (err instanceof NotFoundError) throw new BadRequestError(`Invalid username ${username}`);
      else throw err;
    }
    if (user.funds < Market.PLOT_PRICE) throw new BadRequestError(`${username} has insufficient funds for new farm plot`);
    if (user.farmCount+1 > MAX_PLOTS) throw new BadRequestError(`${username} has reached max amount of farm plots`);
    const res = await Farm.create({ owner: username, location: locationID });
    await User.update(username, { funds: user.funds - Market.PLOT_PRICE });

    return res;
  }
}