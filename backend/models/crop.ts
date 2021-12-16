import db from "../db";
import { BadRequestError, NotFoundError } from "../expressError";
import { sqlForPartialUpdate } from "../utils/sql";
import { falsyNoZero } from "../utils/helpers";

interface UpdateProps {
  curGrowthStage?: number,
  health?: number,
  moisture?: number
}

interface CropMoistureCalcProps {
  cropID?: number,
  moisture?: number,
  dryRate?: number
}

interface CropCreateProps {
  farmID: number,
  farmX: number,
  farmY: number,
  berryType: string,
  curGrowthStage? : number
}

interface CropGrowthCalcProps {
  health: number,
  moisture: number,
  idealTemp: number,
  idealCloud: number,
  avgTemp: number,
  avgCloud: number
}

export default class Crop{
  /** Finds crop with given ID in database
   *  Returns { id, moisutre, health, curGrowthStage, plantedAt, berryType, farmID, farmX, farmY }
   *  Throws NotFoundError if no crop with given ID
   */
  static async get(cropID:number){
    const res = await db.query(
      `SELECT id, moisture, health, cur_growth_stage AS "curGrowthStage",
              planted_at AS "plantedAt", berry_type AS "type", 
              farm_id AS "farmID", farm_x AS "x", farm_y AS "y",
              bp.growth_time AS "growthTime", bp.max_harvest AS "maxHarvest",
              bp.size, bp.dry_rate AS "dryRate", bp.poke_type AS "pokeType",
              bp.poke_power AS "pokePower", bp.ideal_cloud AS "idealCloud", bp.ideal_temp AS "idealTemp"
       FROM crops
       JOIN berry_profiles bp ON bp.name = crops.berry_type
       WHERE id = $1`, [cropID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No crop found with id ${cropID}`);
    // Destructure crop data
    const {id, moisture, health, curGrowthStage, plantedAt, farmID, x, y} = res.rows[0];
    // Destructure berry profile data
    const {type, growthTime, maxHarvest, size, dryRate, pokeType, pokePower, idealCloud, idealTemp} = res.rows[0];
    // Build and return crop object
    return {
      id, curGrowthStage, plantedAt, farmID, x, y,
      moisture : Number(moisture),
      health : Number(health),
      berry: {
        type, growthTime, maxHarvest, size, pokeType, 
        dryRate: Number(dryRate), pokePower: Number(pokePower),
        idealCloud: Number(idealCloud), idealTemp: Number(idealTemp)
      }
    };
  }
  /** Calculates the new health of a crop upon reaching a growth stage, using weather data
   *  moisture, and health at the point of growth.
   */
  static calcHealth({ health, moisture, idealTemp, idealCloud, avgTemp, avgCloud }:CropGrowthCalcProps){
    // +/- 32% of ideal, 1.0x to 1.15x bonus
    // Past +/- 32% of ideal, gradual decline from 1.0x to 0x modifier
    const cloudMod = Math.max(0, (Math.cos((avgCloud / idealCloud) - 1) * 3 - 1.85)); 
    // As above with +/- 26% range, up to 1.2x bonus
    const tempMod = Math.max(0, (Math.cos(avgTemp / idealTemp - 1) * 6 - 4.8));

    // Starting at 95-105 moisture, +25 health adjustment
    // From there, every +/- 5 moisture, health adjustment is reduced by 5
    // Above 110 moisture, health adjustment is reduced by 5 for every 2 excess moisture, scaling infinitely
    // Below 20 moisture, health adjustment is capped at -50
    let healthAdj;
    if (moisture > 110){
      healthAdj = 15 - (5 * Math.floor((moisture-110) * 0.5));
    } else if (moisture <= 20){
      healthAdj = -50;
    } else {
      healthAdj = 25 - (5 * Math.floor(Math.abs(100-moisture) * 0.2));
    }
    // Adjust current health by the average of our two weather modifiers, then apply health adjustment (determined by moisture)
    const newHealth = (health * ((cloudMod + tempMod) * 0.5)) + healthAdj;
    return Math.min(100, (Math.max(0, newHealth)));
  }

  /** Calculates and returns a new moisture level for the given crop.
   *  moisture (m) = m - (dryRate * (timeDelta / 3600))
   *  Throws BadRequestError if no valid calculation props
   * @param timeDelta Amount of time between now and last moisture check (in seconds)
   * @param cropProps { cropID: lookup props with this ID, moisture: starting moisture, dryRate: dry rate per hour }
   */
  static async calcMoisture(timeDelta:number, {cropID, moisture, dryRate}:CropMoistureCalcProps){
    if (cropID){
      try {
        const crop  = await Crop.get(cropID);
        moisture = crop.moisture;
        dryRate = crop.berry.dryRate;
      } catch (err) {
        if (err instanceof NotFoundError && (falsyNoZero(moisture) || falsyNoZero(dryRate)) ){
          throw new NotFoundError(`Attempted lookup of invalid crop id ${cropID} with no fallback calculation props.`);
        }
      }
    }
    if (falsyNoZero(moisture) || falsyNoZero(dryRate)){
      throw new BadRequestError('Missing dryRate and/or initial moisture for moisture calc. Supply variables or cropID for lookup.');
    }
    //@ts-ignore
    const m = moisture - (dryRate * (timeDelta / 3600));
    return Math.max(0, m)
  };

  /** Updates crop with given ID with provided data
   *  Returns object with updated crop data
   *  Throws NotFoundError if no crop with given ID
   *  
   *  SECURITY RISK: The interface of the data param is checked by Typescript, which does not validate at runtime.
   *  Therefore, data should be passed to this method explicitly, or request bodies should be validated via a schema 
   *  before calling this method, as this method will update any fields provided in the data param.
   *  --
   *  GOOD: Crop.update(1, { moisture: req.body.moisture, health: req.body.health });
   *  BAD: Crop.update(1, req.body); OR Crop.update(1, {...req.body});
   */
  static async update(cropID:number, data:UpdateProps){
    const { values, setCols } = sqlForPartialUpdate(data, {"curGrowthStage" : "cur_growth_stage"});
    const res = await db.query(
      `UPDATE crops SET ${setCols}
       WHERE id = $${values.length+1}
       RETURNING id, moisture, health, cur_growth_stage AS "curGrowthStage",
                 planted_at AS "plantedAt", berry_type AS "berryType",
                 farm_id AS "farmID", farm_x AS "x", farm_y AS "y"
      `, [...values, cropID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No crop found with id ${cropID}`);
    return {
      ...res.rows[0],
      moisture: Number(res.rows[0].moisture),
      health: Number(res.rows[0].health)
    };
  }
  /** Creates a new crop with given data
   *  Throws BadRequestError on duplicate farm coordinates, invalid berry type or invalid farm id
   */
  static async create({berryType, farmID, farmX, farmY, curGrowthStage=0}:CropCreateProps){
    try {
      const res = await db.query(
        `INSERT INTO crops (farm_id, farm_x, farm_y, berry_type, cur_growth_stage)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, berry_type AS "berryType", moisture, health, planted_at AS "plantedAt",
                   cur_growth_stage AS "curGrowthStage", farm_id AS "farmID",
                   farm_x AS "x", farm_y AS "y"`,
        [farmID, farmX, farmY, berryType, curGrowthStage]
      );
      return {
        ...res.rows[0],
        moisture: Number(res.rows[0].moisture),
        health: Number(res.rows[0].health)
      };
    } catch (err:any) {
      if (err.code && err.code === '23505') throw new BadRequestError(`Duplicate farm coordinates (${farmX}, ${farmY})`);
      if (err.code && err.code === '23503'){
        const msg = err.constraint === 'crops_berry_type_fkey' ? `Invalid berry type ${berryType}` : `Invalid farm id ${farmID}`;
        throw new BadRequestError(msg);
      };
      throw err;
    }
  }
  /** Deletes crop with given id.
   *  Throws NotFoundError if no crop with such id.
   */
  static async delete(cropID:number){
    const res = await db.query(
      `DELETE FROM crops WHERE id = $1 RETURNING id`, [cropID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No crop with id ${cropID}`);

    return { deleted : cropID };
  }
}