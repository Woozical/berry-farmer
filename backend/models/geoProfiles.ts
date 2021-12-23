import db from "../db";
import WeatherAPI from "../utils/weatherAPI";
import { dateToHString } from "../utils/helpers";
import { BadRequestError, NotFoundError } from "../expressError";

export default class GeoProfile {

  /** Attempts to find the geo_profile ID of a given location with the
   *  unique name, region, country grouping. Throws NotFoundError on no results.
   */
  static async findID(name:string, region:string, country:string){
    const q = await db.query('SELECT id FROM geo_profiles WHERE name = $1 AND region = $2 AND country = $3',
                              [name, region, country]);
    if (q.rowCount < 1) throw new NotFoundError();
    return q.rows[0].id;
  }

  /** Given a valid WeatherAPI search term (e.g. postal code, city name, etc.), queries the WeatherAPI
   *  for the name, region, country of that location, as well as history/forecast data for the date of creation (i.e. today)
   *  Location info is then saved to geo_profiles table, and a summary of weather data (that this BerryFarmer uses) is saved
   *  to weather_data table.
   *  
   *  Returns { id, name, region, country } of created geo_profiles
   *  Throws BadRequestError if the searchTerm results in a location that already exists in geo_profiles
   */
  static async create(locSearchTerm:string){
    const today = new Date();
    /** Grab location and weather data from API */
    const res = await WeatherAPI.getWeatherOn(locSearchTerm, dateToHString(today));
    const tableData = WeatherAPI.summaryWeatherData(res);
    /** Insert data into DB */
    try {
      const q = await db.query(
        `INSERT INTO geo_profiles (name, region, country)
         VALUES ($1, $2, $3)
         RETURNING id`, [tableData.name, tableData.region, tableData.country]
      );
      const { id } = q.rows[0];
      await db.query(
        `INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall)
         VALUES ($1, $2, $3, $4, $5)`, [id, today, tableData.avgTemp, tableData.avgCloud, tableData.totalRainfall]
      );
      return { id, name: tableData.name, region: tableData.region, country: tableData.country }
    } catch (err:any) {
      if (err.constraint && err.constraint === 'uc_geo_profiles_name_region_country'){
        throw new BadRequestError(`Location (${tableData.name}, ${tableData.region}, ${tableData.country}) already exists`);
      }
      throw err;
    }
  }
}