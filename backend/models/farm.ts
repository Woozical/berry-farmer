import db from "../db";
import { NotFoundError } from "../expressError";

interface CropObject{
  id: number, berryType: string, curGrowthStage: number,
  moisture: number, health: number, plantedAt: Date,
  x: number, y: number
};

interface FarmObject{
  id: number, length: number, width: number, irrigationLVL: number,
  owner: string, locationName: string, locationRegion: string,
  locationCountry: string, crops: Array<CropObject>,
  lastCheckedAt: Date
}

export default class Farm{

  static async get(farmID:number) : Promise<FarmObject>{
    const res = await db.query(
      `SELECT farms.id AS "id", farms.length, farms.width, farms.irrigation_lvl AS "irrigationLVL", 
       farms.last_checked_at AS "lastCheckedAt", farms.owner, gp.name AS "locationName",
       gp.region AS "locationRegion", gp.country as "locationCountry",
       crops.id AS "cropID", crops.berry_type AS "berryType", crops.cur_growth_stage AS "curGrowthStage",
       crops.moisture, crops.health, crops.planted_at AS "plantedAt", crops.farm_x AS "x", crops.farm_y AS "y"
       FROM farms
       JOIN geo_profiles gp ON gp.id = farms.location
       LEFT JOIN crops ON crops.farm_id = farms.id
       WHERE farms.id = $1`, [farmID]
    );

    if (res.rowCount < 1) throw new NotFoundError(`No farm with id ${farmID}`);

    const { id, length, width, irrigationLVL, lastCheckedAt, owner, locationName, locationRegion, locationCountry } = res.rows[0];
    // build out array of crops
    let crops:Array<CropObject> = [];
    if (res.rows[0].cropID){
      crops = res.rows.map(
        ({cropID, berryType, curGrowthStage, moisture, health, plantedAt, x, y}) => {
          return {id: cropID, berryType, curGrowthStage: +curGrowthStage, moisture: +moisture, health: +health, plantedAt, x, y};
        }
      );
    }
    return {
      id, length, width, irrigationLVL, lastCheckedAt, owner,
      locationName, locationRegion, locationCountry, crops
    }

  }

  static async getByOwner(username:string){
    const res = await db.query(
      `SELECT farms.id AS "id", farms.length, farms.width, farms.irrigation_lvl AS "irrigationLVL",
      farms.last_checked_at AS "lastCheckedAt", gp.name AS "locationName", gp.region AS "locationRegion",
      gp.country as "locationCountry"
      FROM users
      LEFT JOIN farms ON farms.owner = users.username
      LEFT JOIN geo_profiles gp ON gp.id = farms.location
      WHERE users.username = $1;`, [username]);
    
      if (res.rowCount < 1) throw new NotFoundError(`No user with username ${username}`);
      return res.rows[0].id ? res.rows : [];
  }
}