import axios from "axios";
import { WEATHER_API_KEY, API_URL } from "../config";
import { asyncReattempt, dateToHString } from "./helpers";
import type HistoryAPIResponse from "../schemas/HistoryAPIResponse";
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from "../expressError";

interface SummaryObject {
  avgCloud: number
  avgTemp: number
  date: string
  totalRainfall: number
  name: string
  region: string
  country: string
}
/** Namespace for API calls to https://api.weatherapi.com/ */
export default class WeatherAPI {
  /** Calls external web API for weather information at the given location on the given date.
   *  Date should be a string in YYYY-MM-DD format (leading 0s for single digit days/months)
   *  Location should ideally be the full location: name, region and country. (E.g. Houston Texas United States)
   *  
   *  If our API calls fail for network or server errors (on their end) then we will attempt
   *   up to 3 additional times for a response.
   */
  static async getWeatherOn(location:string, date: string): Promise<HistoryAPIResponse>{
     if (process.env.NODE_ENV !== "test") console.log("Calling Weather API for location, date:", location, date);
    const params = { key: WEATHER_API_KEY, q: location, dt: date };
    const endpoint = `${API_URL}/history.json`;
    try {
      const res = await axios.get(endpoint, { params });
      return res.data
    } catch (err:any) {
      // Re-attempt 3 times if Network or API error
      if (!err.response || err.response.status / 500 >= 1){
        // Give a name to our callback function for max re-attempts error logging
        const res = await asyncReattempt( function getWeather () {
          return axios.get(endpoint, { params });
        }, 3);
        return res.data;
      }
      // On other axios errors, wrap in a better user-facing express error
      else if (err.response){
        switch (err.response.status){
          case 400:
            throw new BadRequestError(
              `WeatherAPI responded with 400 BadRequest Error, check your search term '${location}' or contact an administrator about this issue.`
            );
          case 401:
            throw new UnauthorizedError("WeatherAPI responded with 401 Unauthorized Error, please contact an administrator about this issue.");
          case 403:
            throw new ForbiddenError("WeatherAPI responded with 403 Forbidden Error, please contact an administrator about this issue.");
          case 404:
            throw new NotFoundError(
              `WeatherAPI responded with 404 Not Found Error, check your search term '${location}' or contact an administrator about this issue.`
            );
          default:
            console.log(`${new Date()} UNCAUGHT API ERROR:`, err);
            throw new Error("WeatherAPI responded with an uncaught error.")
        }
      }
      // If error came from async re-attempt timeout, wrap in better user-facing error
      else if (err.message.includes("Exceded maximum reattempts on asynchronous operation")){
        throw new Error("Could not connect with WeatherAPI after multiple re-attempts");
      }
      // Throw original error otherwise
      throw err;
    }
  }

  /** Similar to getWeatherOn, only for a date range. Requests are made for each sequential date inbetween
   *  the start and end date, inclusive. API requests are sent out concurrently.
   */
  static async getWeatherBetween(location:string, startDate:Date, endDate:Date){
    const requests = [];
    // Convert start and end date to Midnight  of those dates, then save unix epoch to variable
    let start = new Date(dateToHString(startDate)).getTime();
    let end = new Date(dateToHString(endDate)).getTime();
    // Make a request for every 24 hour period
    while (start <= end) {
      const d = new Date(start);
      const dateString = dateToHString(d);
      const req = WeatherAPI.getWeatherOn(location, dateString)
      requests.push(req);
      start += 86400000;
    }

    const res = await Promise.all(requests);
    return res;
  }

  /** Returns a daily average of temperature (in celsius), average cloud %, and total rainfall (in mm)  */
  static summaryWeatherData(data:HistoryAPIResponse) : SummaryObject{
    let cSum = 0;
    for (let hour of data.forecast.forecastday[0].hour){
      cSum += hour.cloud;
    }
    return {
      avgTemp: data.forecast.forecastday[0].day.avgtemp_c,
      totalRainfall: data.forecast.forecastday[0].day.totalprecip_mm,
      date: data.forecast.forecastday[0].date,
      name: data.location.name,
      region: data.location.region,
      country: data.location.country,
      avgCloud: (cSum / 24)
    };
  }
}