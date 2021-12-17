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


  /** This method is responsible for querying database, cleaning and returning 
   *  applicable information for a crop sync operation on a given farm.
   */
  private static async pullSyncData(farmID:number){
    // Query for required crop and berry data
    const cropRes = await db.query(
      `SELECT crops.id, crops.cur_growth_stage AS "curGrowthStage", crops.moisture, crops.planted_at AS "plantedAt", crops.health,
              bp.growth_time AS "growthTime", bp.dry_rate AS "dryRate", bp.ideal_temp as "idealTemp", bp.ideal_cloud AS "idealCloud",
              farms.irrigation_lvl AS "irrigationLVL", farms.last_checked_at AS "lastCheckedAt", farms.location, farms.owner
        FROM crops
        JOIN berry_profiles bp ON bp.name = crops.berry_type
        JOIN farms ON farms.id = crops.farm_id
        WHERE farms.id = $1`, [farmID]
    );
    if (cropRes.rowCount < 1) throw new NotFoundError(`No farm found with id ${farmID}`);
    // Query for weather data on this farm's location
    const weatherRes = await db.query(
      `SELECT wd.date, wd.avg_temp AS "avgTemp", wd.avg_cloud AS "avgCloud", wd.total_rainfall AS "totalRain"
        FROM weather_data wd
        JOIN farms ON wd.location = farms.location
        WHERE farms.id = $1`, [farmID]
    );

    // Clean query responses
    const crops = cropRes.rows.map( ({id, health, curGrowthStage, moisture, plantedAt, growthTime, dryRate, idealTemp, idealCloud}) => {
      return {
        id, curGrowthStage, moisture: Number(moisture), plantedAt, growthTime, health: Number(health),
        dryRate: Number(dryRate), idealTemp: Number(idealTemp), idealCloud: Number(idealCloud)}
    });
    const weatherData = new Map();
    weatherRes.rows.forEach( ({date, avgTemp, avgCloud, totalRain}) => {
      weatherData.set(date.toDateString(), {
        avgTemp: Number(avgTemp), avgCloud: Number(avgCloud), totalRain: Number(totalRain)
      });
    });
    const { irrigationLVL, lastCheckedAt, location, owner } = cropRes.rows[0];

    return { weatherData, crops, irrigationLVL, lastCheckedAt, location, owner };

  }

  static async syncCrops(farmID:number){
    const data = await Farm.pullSyncData(farmID);

    const today = new Date().toDateString(); // Get today's date with no time (00:00:00)
    const now = Date.now();

    // Sync each crop
    for (let crop of data.crops){
      /** Ignore fully grown crops. TO DO: Re-plant crops older than 2+ days */
      if (crop.curGrowthStage === 4){
        continue
      }

      const plantedTimeMS = crop.plantedAt.getTime();
      const growthTimeMS = (crop.growthTime * 3600000); // Convert hour -> ms
      // Determine how many growths occured between last growth and now
      const numGrowths = Math.floor(((now - plantedTimeMS) - (crop.curGrowthStage * growthTimeMS)) / growthTimeMS);
      
      // Perform each growth
      for (let i = 0; i < numGrowths; i++){
        if (crop.curGrowthStage === 4) break;
        // Get time info at point of new growth
        const nextGrowthTime = plantedTimeMS + (growthTimeMS * (crop.curGrowthStage + 1));
        const growthDelta =  ((nextGrowthTime - data.lastCheckedAt.getTime()) - (i * growthTimeMS)) * 0.001; // ms -> seconds
        const dateOfGrowth = new Date(nextGrowthTime).toDateString();

        // Dehydrate at point of new growth
        let growthMoisture = await Crop.calcMoisture(growthDelta, {dryRate: crop.dryRate, moisture: crop.moisture });
        const { avgTemp, avgCloud, totalRain } = data.weatherData.get(dateOfGrowth);
        // Add rain at point of new growth
        growthMoisture += (totalRain * (growthDelta / 86400)) * 100;
        // For each irrigation lvl, 20% of difference between max and current moisture is made up for
        growthMoisture += (data.irrigationLVL * 0.2) * (100 - growthMoisture);
        // Perform growth health calculations
        const growthHealth = Crop.calcHealth({
          health: crop.health, avgTemp, avgCloud, moisture: growthMoisture,
          idealTemp: crop.idealTemp, idealCloud: crop.idealCloud
        });
        // Update with new data
        crop.health = growthHealth;
        crop.moisture = growthMoisture;
        crop.curGrowthStage += 1;
      }

      // If we grew to stage 4 as part of this sync, update now and ignore remainder time operations
      if (crop.curGrowthStage === 4){
        await Crop.update(crop.id, {health: crop.health, curGrowthStage: crop.curGrowthStage, moisture: crop.moisture});
        continue;
      }

      /** Perform remainder operations between now and latest growth/checkedAt */
      const timeDelta = (numGrowths > 0) ?
      (now - (plantedTimeMS + (growthTimeMS * crop.curGrowthStage))) * 0.001 :
      (now - data.lastCheckedAt.getTime()) * 0.001; // Convert ms -> seconds

      // Get baseline new moisture from dehydration
      let newMoisture = await Crop.calcMoisture(timeDelta, {dryRate: crop.dryRate, moisture: crop.moisture});
      // Account for rain, adjusted by time delta, where 0.01mm rainfall = 1 moisture
      newMoisture += (data.weatherData.get(today).totalRain * (timeDelta / 86400)) * 100;
      
      await Crop.update(crop.id, {health: crop.health, curGrowthStage: crop.curGrowthStage, moisture: newMoisture});

    }
    // TO DO: Make use of update method here once implemented
    await db.query('UPDATE farms SET last_checked_at = $1 WHERE id = $2', [new Date(now), farmID]);
  }
}