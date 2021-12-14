import db from "../db";
import { NotFoundError } from "../expressError";
import { sqlForPartialUpdate } from "../utils/sql";

interface UpdateProps {
  curGrowthStage?: number,
  health?: number,
  moisture?: number
}

export default class Crop{
  /** Finds crop with given ID in database
   *  Returns { id, moisutre, health, curGrowthStage, plantedAt, berryType, farmID, farmX, farmY }
   *  Throws NotFoundError if no crop with given ID
   */
  static async get(cropID:number){
    const res = await db.query(
      `SELECT id, moisture, health, cur_growth_stage AS "curGrowthStage",
              planted_at AS "plantedAt", berry_type AS "berryType", 
              farm_id AS "farmID", farm_x AS "farmX", farm_y AS "farmY"
       FROM crops
       WHERE id = $1`, [cropID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No crop found with id ${cropID}`);
    return {
      ...res.rows[0],
      moisture : Number(res.rows[0].moisture),
      health : Number(res.rows[0].health),
    };
  }

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
                 farm_id AS "farmID", farm_x AS "farmX", farm_y AS "farmY"
      `, [...values, cropID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No crop found with id ${cropID}`);
    return {
      ...res.rows[0],
      moisture: Number(res.rows[0].moisture),
      health: Number(res.rows[0].health)
    };
  }
}