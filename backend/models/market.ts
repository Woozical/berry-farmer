import db from "../db";
import { BadRequestError, NotFoundError } from "../expressError";
import Farm from "./farm";
import User from "./user";

interface DimensionUpProps{
  length:number,
  width:number
}

const MAX_LENGTH = 9;
const MAX_WIDTH = 9;
const MAX_IRRIG = 5;
const MAX_PLOTS = 3;

export default class Market {
  static IRRIG_PRICE = 300;
  static PLOT_PRICE = 1000;
  static LW_PRICE = 100;
  static BERRY_PURCHASE_MARKUP = 1.15;

  /** Attempts to purchase a length and/or width upgrade for a given farm.
   *  The farm must be owned by the provided username, and that user must have
   *  succificient funds as defined on the LW_PRICE field of this class.
   *  Each further upgrade costs more by a factor of LW_PRICE, e.g.  3 -> 4 is 400, 4 -> 5 is 500
   * 
   *  Takes an object DimensionUpProps as its third paramater, which has two fields:
   *  { length: Amount to increment farm's length column, width: Amount to increment farm's width column }
   *  Both fields are required, pass 0 if only upgrading one dimension. E.g. { length: 2, width: 0 }
   *  
   *  Will update farm length and width as appropriate and deduct appropraite amount from user's funds column.
   */
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
      throw new BadRequestError(`${username} has insufficient funds for requested upgrades. (Required: $${upgradePrice})`);
    }

    const farm = await Farm.update(farmID, { length: length + q.rows[0].length, width: width + q.rows[0].width });
    await User.update(username, {funds: Number(q.rows[0].funds) - upgradePrice});
    return farm;
  }

  /** Attempts to purchase an irrigation level upgrade for a given farm.
   *  The farm must be owned by the provided username, and that user must have
   *  succificient funds as defined on the IRRIG_PRICE field of this class.
   *  Each further upgrade costs more by a factor of IRRIG_PRICE, e.g.  0 -> 1 is 300, 4 -> 5 is 2500
   *  
   *  Each call of this method will increment the farm's irrigation_lvl by 1 and deduct
   *  the appropriate amount from the user's funds.
   */
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
      throw new BadRequestError(`${username} has insufficient funds for requested upgrades (Required: $${upgradePrice})`);
    }
    const farm = await Farm.update(farmID, {irrigationLVL: upgradedIrrigLVL});
    await User.update(username, {funds: Number(q.rows[0].funds) - upgradePrice});
    return farm;
  }

  /** Attempts to purchase a new farm plot for a given user.
   *  The farm must be have a valid geo_profile id to be located in, and the user must have
   *  succificient funds as defined on the PLOT_PRICE field of this class.
   *  As such, this method should be called AFTER potentially creating a new geo_profile from user input.
   *  
   *  Each user may only be associated with a maximum number of farms, 
   *  as defined in the MAX_PLOTS constant at the top of this file.
   * 
   *  Throws BadRequestError on invalid username, insufficient funds or max farm plots reached.
   */
  static async purchaseFarm(username:string, locationID:number){
    let user;
    try {
      user = await User.get(username);
    } catch (err) {
      if (err instanceof NotFoundError) throw new BadRequestError(`Invalid username ${username}`);
      else throw err;
    }
    if (user.funds < Market.PLOT_PRICE) throw new BadRequestError(`${username} has insufficient funds for new farm plot. (Required: $${Market.PLOT_PRICE})`);
    if (user.farmCount+1 > MAX_PLOTS) throw new BadRequestError(`${username} has reached maximum amount of farm plots.`);
    const res = await Farm.create({ owner: username, locationID });
    await User.update(username, { funds: user.funds - Market.PLOT_PRICE });

    return res;
  }

  /** Performs a purchase order for given user, of given berry type and amount, with defined price per berry.
   *  Berry price per unit is ephemeral and stored in server memory during runtime, so it's a parameter here rather than something
   *  accessed in the DB. Adds the requested berries to user_inventories and deducts appropriate funds from user.
   * 
   *  Returns an object with success message and the cost of the operation.
   *  Throws BadRequestError if invalid username or insufficient user funds for purchase
   */
  static async purchaseBerry(username:string, berryType:string, berryPrice:number, berryAmount:number){
    let user;
    try {
      user = await User.get(username);
    } catch (err) {
      if (err instanceof NotFoundError) throw new BadRequestError(`Invalid username ${username}`);
      else throw err;
    }
    /** Berries are purchased at a markup of their market value */
    const buyOrderPrice = Number((berryPrice * Market.BERRY_PURCHASE_MARKUP * berryAmount).toFixed(2));
    if (user.funds < buyOrderPrice) throw new BadRequestError(`${username} has insufficient funds for purchase. (Required: $${buyOrderPrice})`);
    await User.addBerry(username, berryType, berryAmount);
    await User.update(username, { funds: user.funds - buyOrderPrice });
    return { message: `Bought ${berryAmount} ${berryType} for $${buyOrderPrice}`, buyOrderPrice };
  }

  /** Performs a purchase order for given user, of given berry type and amount, with defined price per berry.
   *  Berry price per unit is ephemeral and stored in server memory during runtime, so it's a parameter here rather than something
   *  accessed in the DB. Removes the requested berries from user_inventories and adds appropriate funds from user.
   *  
   *  Returns an object with success message and the funds gained from the operation.
   *  Throws BadRequestError if invalid username or insufficient amount of berries for transaction in user inventory.
   */
  static async sellBerry(username:string, berryType:string, berryPrice:number, berryAmount:number){
    let user;
    try {
      user = await User.get(username);
    } catch (err) {
      if (err instanceof NotFoundError) throw new BadRequestError(`Invalid username ${username}`);
      else throw err;
    }
    const sellOrderPrice = Number((berryPrice * berryAmount).toFixed(2));
    if (user.inventory[berryType] < berryAmount) throw new BadRequestError(
      `Cannot sell ${berryAmount} ${berryType} berries. ${username} only has ${user.inventory[berryType]}`
    );
    await User.deductBerry(username, berryType, berryAmount * -1);
    await User.update(username, { funds: user.funds + sellOrderPrice });
    return { message: `Sold ${berryAmount} ${berryType} for $${sellOrderPrice}`, sellOrderPrice };
  }
}