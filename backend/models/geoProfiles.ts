import db from "../db";
import WeatherAPI from "../utils/weatherAPI";
import { dateToHString } from "../utils/helpers";
import { BadRequestError, NotFoundError } from "../expressError";

interface WeatherMapObject {
  avgTemp: number, avgCloud: number, totalRain: number
}

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

  static async getWeatherBetween(locationID:number, start:Date, end:Date) : Promise<Map<string, WeatherMapObject>>{
    // Trim time off startDate and endDate
    const startDate = new Date(start.toDateString());
    const endDate = new Date(end.toDateString());

    const weatherData = new Map();
    const res = await db.query(
      `SELECT date, avg_temp AS "avgTemp", avg_cloud AS "avgCloud", total_rainfall AS "totalRain",
              gp.name, gp.region, gp.country
       FROM weather_data
       LEFT JOIN geo_profiles gp ON gp.id = weather_data.location
       WHERE location = $1
       AND date BETWEEN $2 and $3
       ORDER BY date`, [locationID, startDate, endDate]
    );

    // check if we have info for every date between start and end
    const expected = 1 + ((endDate.getTime() - startDate.getTime()) / 86400000);
    if (res.rowCount < expected){
      // if not, do API calls to fill out missing
      const { name, region, country } = res.rows[0];
      const locString = `${name}, ${region}, ${country}`;
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
      // put api data into our return Map object
      for (let response of apiRes){
        const data = WeatherAPI.summaryWeatherData(response);
        weatherData.set(data.date, {
          avgTemp: data.avgTemp, avgCloud: data.avgCloud,
          totalRain: data.totalRainfall
        });
      }
    }
    
    // use what DB info we have to build out return Map
    res.rows.forEach( ({date, avgTemp, avgCloud, totalRain}) => {
      weatherData.set(dateToHString(date), {
        avgTemp: Number(avgTemp), avgCloud: Number(avgCloud), totalRain: Number(totalRain)
      });
    });
    // start the query to insert missing data into db but do not await it
    
    return weatherData;
  }
}