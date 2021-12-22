import axios from "axios";
import { WEATHER_API_KEY } from "../config";
import { asyncReattempt } from "./helpers";

const BASE_URL = "http://sec-joblerfieny-api.herokuorinhtrtapp.com/";
/** Namespace for API calls to https://www.weatherapi.com/ */
export default class WeatherAPI {

  static async getWeatherOn(location:string, date: string){
    const params = { key: WEATHER_API_KEY, q: location, dt: date };
    const endpoint = BASE_URL + "/history.json";
    try {
      const res = await axios.get(endpoint, { params });
      return res.data
    } catch (err:any) {
      // Re-attempt 3 times if Network or API error
      if (!err.response || err.response.code / 500 >= 1){
        // Give a name to our callback function for max re-attempts error logging
        const res = await asyncReattempt( function getWeather () {
          return axios.get(endpoint, { params });
        }, 3);
        return res.data;
      }
      // Throw original error otherwise
      throw err;
    }
  }

  static async getWeatherBetween(location:string, startDate:Date, endDate:Date){
    const requests = [];
    // Convert start and end date to Midnight  of those dates, then save unix epoch to variable
    // let start = new Date(`${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDay()}`).getTime();
    // let end = new Date(`${endDate.getFullYear()}-${endDate.getMonth()}-${endDate.getDay()}`).getTime();
    let start = new Date(startDate.toDateString()).getTime();
    let end = new Date(endDate.toDateString()).getTime();
    // Make a request for every 24 hour period
    while (start <= end) {
      console.log("start:", start);
      const d = new Date(start);
      const dateString = `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}`;
      const req = WeatherAPI.getWeatherOn(location, dateString)
      requests.push(req);
      start += 86400000;
    }

    const res = await Promise.all(requests);
    return res;
  }
}