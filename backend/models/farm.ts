import db from "../db";
import Crop from "./crop";
import { BadRequestError, NotFoundError } from "../expressError";

interface CropObject {
  id: number, berryType: string, curGrowthStage: number,
  moisture: number, health: number, plantedAt: Date,
  x: number, y: number
};

interface FarmObject {
  id: number, length: number, width: number, irrigationLVL: number,
  owner: string, locationName: string, locationRegion: string,
  locationCountry: string, crops: Array<CropObject>,
  lastCheckedAt: Date
}

interface CreateFarmProps {
  owner: string, location: number, length?: number, 
  irrigationLVL?: number, width?: number
}

const DEFAULT_WIDTH = 3;
const DEFAULT_LENGTH = 3;

export default class Farm{

  /** Get detail information on a farm with given id
   *  Throws NotFoundError if no farm with such id
   */
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

  /** Gets a list of farms owned by a given username.
   *  Each object in list contains basic farm data (crops not included)
   *  Throws NotFoundError if no such user
   */
  static async getByOwner(username:string){
    const res = await db.query(
      `SELECT farms.id AS "id", farms.length, farms.width, 
              farms.last_checked_at AS "lastCheckedAt", farms.irrigation_lvl AS "irrigationLVL",
              gp.name AS "locationName", gp.region AS "locationRegion", gp.country as "locationCountry"
       FROM users
       LEFT JOIN farms ON farms.owner = users.username
       LEFT JOIN geo_profiles gp ON gp.id = farms.location
       WHERE users.username = $1;`, [username]);
    
      if (res.rowCount < 1) throw new NotFoundError(`No user with username ${username}`);
      return res.rows[0].id ? res.rows : [];
  }

  /** Deletes farm with given ID.
   *  Throws NotFoundError if no farm with such id.
   */
  static async delete(farmID:number){
    const res = await db.query(
      `DELETE FROM farms WHERE id = $1 RETURNING id`, [farmID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No farm with id ${farmID}`);
    return { deleted: farmID };
  }

  /** Creates farm */
  static async create({owner, location, length=DEFAULT_LENGTH, width=DEFAULT_WIDTH, irrigationLVL=0}:CreateFarmProps){
    try {
      const res = await db.query(
        `INSERT INTO farms (owner, location, length, width, irrigation_lvl)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, length, width, irrigation_lvl AS "irrigationLVL",
                   owner, location AS "locationID", last_checked_at AS "lastCheckedAt"`,
        [owner, location, length, width, irrigationLVL]
      );
      return { ...res.rows[0] };
    } catch (err:any) {
      if (err.code && err.code === '23503'){
        const msg = err.constraint === 'farms_owner_fkey' ? `Invalid username ${owner}` : `Invalid location id ${location}`;
        throw new BadRequestError(msg);
      }
      throw err;
    }
  }

  static async syncCrops(farmID:number){
    // Query for required crop and berry data
    const cropRes = await db.query(
      `SELECT crops.id, crops.cur_growth_stage AS "curGrowthStage", crops.moisture, crops.planted_at AS "plantedAt",
              bp.growth_time AS "growthTime", bp.dry_rate AS "dryRate", bp.ideal_temp as "idealTemp", bp.ideal_cloud AS "idealCloud",
              farms.irrigation_lvl AS "irrigationLVL, farms.last_checked_at AS "lastCheckedAt", farms.location,
              wd.avg_temp AS "avgTemp", wd.avg_cloud AS "avgCloud", wd.total_rainfall AS "totalRain"
       FROM crops
       JOIN berry_profiles bp ON bp.name = crops.berry_type
       JOIN farms ON farms.id = crops.farm_id
       JOIN weather_data wd ON farms.location = wd.location
       WHERE farms.id = $1`, [farmID]
    );

    // Query for weather data on this farm's location
    const weatherRes = await db.query(
      `SELECT wd.date, wd.avg_temp AS "avgTemp", wd.avg_cloud AS "avgCloud", wd.total_rainfall AS "totalRainfall"
       FROM weather_data wd
       JOIN farms ON wd.location = farms.location
       WHERE farms.id = $1`, [farmID]
    );

    // Clean query responses
    const crops = cropRes.rows.map( ({id, curGrowthStage, moisture, plantedAt, growthTime, dryRate, idealTemp, idealCloud}) => {
      return {
        id, curGrowthStage, moisture: Number(moisture), plantedAt, growthTime,
        dryRate: Number(dryRate), idealTemp: Number(idealTemp), idealCloud: Number(idealCloud)}
    });
    const weatherData = new Map();
    weatherRes.rows.forEach( ({date, avgTemp, avgCloud, totalRain}) => {
      weatherData.set(date, {
        avgTemp: Number(avgTemp), avgCloud: Number(avgCloud), totalRain: Number(totalRain)
      });
    });
    const { irrigationLVL, lastCheckedAt, location } = cropRes.rows[0];

    const today = new Date(new Date().toDateString()); // Get today's date with no time (00:00:00)
    const timeDelta = (Date.now() - lastCheckedAt.getTime()) * 0.001; // Convert ms to seconds

    for (let crop of crops){
      const newMoisture = await Crop.calcMoisture(timeDelta, {cropID: crop.id});
      await Crop.update(crop.id, {moisture: newMoisture});
    }
  }
}