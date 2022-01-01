import db from "../db";
import WeatherAPI from "../utils/weatherAPI";
import { dateToHString } from "../utils/helpers";
import { sqlForPartialUpdate, sqlForFilter } from "../utils/sql";
import type { SQLFilter } from "../utils/sql";
import { BadRequestError, NotFoundError } from "../expressError";

interface WeatherMapObject {
  avgTemp: number, avgCloud: number, totalRain: number
}

interface GeoProfileUpdateProps {
  name?: string, region?: string, country?: string, tzOffset?: number
}

interface GeoProfileSearchParams {
  name?: string, region?: string, country?: string
}

export default class GeoProfile {
  static PAGE_LIMIT = 20;
  static filterDefinitions:Map<string, SQLFilter> = new Map([
    ["name", {column: "name", operation: "ILIKE"}],
    ["region", {column: "region", operation: "ILIKE"}],
    ["country", {column:"country", operation: "ILIKE"}]
  ]);

  /** Attempts to find the geo_profile ID of a given location with the
   *  unique name, region, country grouping. Throws NotFoundError on no results.
   */
  static async findID(name:string, region:string, country:string){
    const q = await db.query('SELECT id FROM geo_profiles WHERE name = $1 AND region = $2 AND country = $3',
                              [name, region, country]);
    if (q.rowCount < 1) throw new NotFoundError();
    return q.rows[0].id;
  }

  /** Get all geo_profiles (with pagination), number of records per page is defined as a static 
   *  field of this class, but can be overriden as the 2nd method parameter.
   */
  static async getAll(page=0, limit=GeoProfile.PAGE_LIMIT){
    const res = await db.query(
      `SELECT id, name, region, country
      FROM geo_profiles
      ORDER BY name, region, country
      OFFSET $1
      LIMIT $2
      `, [(page * limit), limit]);
    return res.rows;
  }

  /** Get all geo_profiles that match the given search parameters (with pagination)
   *  Search params is an object with one or more of the following fields: { name, region, country }
   *  The SQL WHERE clause is structured using ILIKEs, "filterDefinitions" static field on this class, 
   *  as well as documentation for sqlForFilter() function in utils/sql.ts for more info.
   */
  static async filter(searchParams:GeoProfileSearchParams, page=0, limit=GeoProfile.PAGE_LIMIT){
    // Define filters based on given params
    const filters:Array<SQLFilter> = [];
    for (let [key, value] of Object.entries(searchParams)){
      const filter = GeoProfile.filterDefinitions.get(key);
      if (filter === undefined){
        throw new BadRequestError(`Un-supported geo_profile search parameter: ${key}`);
      }
      filter!.value = value;
      filters.push(filter);
    }
    // Build WHERE clause
    const {string:whereString, values:whereValues} = sqlForFilter(filters);
    const res = await db.query(
      `SELECT id, name, region, country
       FROM geo_profiles
       WHERE ${whereString}
       ORDER BY name, region, country
       OFFSET $${whereValues.length+1}
       LIMIT $${whereValues.length+2}
       `, [...whereValues, (page * limit), limit]
    );
    return res.rows;
  }

  /** Get and returns a geo_profile by ID
   *  Returns { id, name, region, country }
   *  Throws NotFoundError if no geo_profile with that ID
   */
  static async get(locationID:number){
    const res = await db.query('SELECT id, name, region, country FROM geo_profiles WHERE id = $1', [locationID]);
    if (res.rowCount < 1) throw new NotFoundError(`No geo profile found with ID of ${locationID}`);
    return res.rows[0];
  }

  /** Update the geo_profile with the given id in the database with the provided data.
   *  Data is an object can include { name, region, country, tzOffset }
   *  Throws NotFoundError if no geo_profile with that ID
   * 
   *  WARNING: geo_profiles are created using data pulled from the WeatherAPI, and are used for
   *  further communication with that API. Editing these fields in DB may have unintended consequences.
   */
  static async update(locationID:number, data:GeoProfileUpdateProps){
    const { values, setCols } = sqlForPartialUpdate(data, {"tzOffset" : "tz_offset"});
    const res = await db.query(
      `UPDATE geo_profiles SET ${setCols}
      WHERE id = $${values.length+1}
      RETURNING id, name, region, country, tz_offset AS "tzOffset"`,
      [...values, locationID]
    );
    if (res.rowCount < 1) throw new NotFoundError(`No geo profile found with ID of ${locationID}`);
    return res.rows[0];
  }

  /** Deletes record from database of geo_profile with given ID.
   *  Be advised that the geo_profile must not be referenced by an farms
   *  in the database, or the deletion will not be permitted due to Null Foreign Key violations
   *  A BadRequestError will be thrown in this instance.
   *  Throws NotFoundError if no such geo_profile with ID
   */
  static async delete(locationID:number){
    try {
      const res = await db.query("DELETE FROM geo_profiles WHERE id = $1 RETURNING id", [locationID]);
      if (res.rowCount < 1) throw new NotFoundError(`No geo profile found with ID of ${locationID}`);
      return { deleted: res.rows[0].id };
    } catch (err:any) {
      if (err.constraint && err.constraint === 'farms_location_fkey'){
        throw new BadRequestError("This location is still referenced by one or more farms.");
      }
      throw err;
    }
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
    /** Calculate timezone offset */
    const offset = Math.floor((new Date(res.location.localtime).getTime() - today.getTime()) / 3600000);
    /** Insert data into DB */
    try {
      const q = await db.query(
        `INSERT INTO geo_profiles (name, region, country, tz_offset)
         VALUES ($1, $2, $3, $4)
         RETURNING id`, [tableData.name, tableData.region, tableData.country, offset]
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

  /** Fetches weather data including and between the given start and end dates.
   *  If weather data for a date is missing in DB, queries WeatherAPI for that data
   *  and then inserts missing data into DB.
   * 
   *  TO DO: It would be nice to utilize a timezone offset derived from the location of the weather data.
   *  Dates are fetched in accordance with local server time. E.g. Server is GMT+0 and GeoProfile is GMT-8
   *  At current, after 4 PM, the given location is querying for tomorrow's weather data.
   *  
   *  It would be simple to implement in this method, but anywhere the Map this method produces would have to
   *  be adjusted to convert from DB local server time dates  to timezone adjusted dates.
   */
  static async getWeatherBetween(locationID:number, start:Date, end:Date) : Promise<Map<string, WeatherMapObject>>{
    // Trim time off startDate and endDate
    const startDate = new Date(start.toDateString());
    const endDate = new Date(end.toDateString());

    const weatherData = new Map();
    const res = await db.query(
      `SELECT wd.date, wd.avg_temp AS "avgTemp", wd.avg_cloud AS "avgCloud", wd.total_rainfall AS "totalRain",
              gp.name, gp.region, gp.country
       FROM geo_profiles gp
       LEFT JOIN weather_data wd ON gp.id = wd.location
       WHERE gp.id = $1
       AND date BETWEEN $2 and $3
       ORDER BY date`, [locationID, startDate, endDate]
    );

    // check if we have info for every date between start and end
    const expected = 1 + ((endDate.getTime() - startDate.getTime()) / 86400000);
    if (res.rowCount < expected){
      // if not, do API calls to fill out missing
      let name:string, region:string, country:string;
      // if we have at least partial data from our first query, use that to make our API location search term
      if (res.rowCount > 0){
        name = res.rows[0].name;
        region = res.rows[0].region;
        country = res.rows[0].country;
      // if not, we need to do another query just for that info
      } else {
        const q = await db.query("SELECT name, region, country FROM geo_profiles WHERE id = $1", [locationID]);
        name = q.rows[0].name;
        region = q.rows[0].region;
        country = q.rows[0].country;
      }
      const locString = `${name} ${region} ${country}`;
      const dates = new Set();
      const requests = [];
      for (let row of res.rows){
        dates.add(dateToHString(row.date));
      }
      // step through each day between start and end date, seeing if it's missing
      // if it is, send out an API call
      for (let i = 0; i < expected; i++){
        const d = dateToHString(new Date(startDate.getTime() + (i * 86400000)));
        if (!dates.has(d)){
          requests.push(WeatherAPI.getWeatherOn(locString, d));
        }
      }
      // wait for all our API calls to come back
      const apiRes = await Promise.all(requests);
      // put api data into our return Map object, and begin to build our SQL query
      let values = "VALUES ";
      for (let response of apiRes){
        const data = WeatherAPI.summaryWeatherData(response);
        weatherData.set(data.date, {
          avgTemp: data.avgTemp, avgCloud: data.avgCloud,
          totalRain: data.totalRainfall
        });
        values = values + `($1, '${data.date}', ${data.avgTemp}, ${data.avgCloud}, ${data.totalRainfall}),`;
      }
      values = values.slice(0, values.length-1) + ";";
      // start the query to insert missing data into db but do not await it, not necessary for our response
      db.query(
        `INSERT INTO weather_data (location, date, avg_temp, avg_cloud, total_rainfall) ${values}`, [locationID]
      );
    }
    
    // use what DB info we have to build out return Map
    res.rows.forEach( ({date, avgTemp, avgCloud, totalRain}) => {
      weatherData.set(dateToHString(date), {
        avgTemp: Number(avgTemp), avgCloud: Number(avgCloud), totalRain: Number(totalRain)
      });
    });
    return weatherData;
  }
}