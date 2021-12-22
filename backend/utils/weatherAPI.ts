import axios from "axios";
import { WEATHER_API_KEY } from "../config";
import { asyncReattempt, dateToHString } from "./helpers";
import type HistoryAPIResponse from "../schemas/HistoryAPIResponse";

interface SummaryObject {
  avgCloud: number
  avgTemp: number
  date: string
  totalRainfall: number
  name: string
  region: string
  country: string
}

const BASE_URL = "http://sec-joblerfieny-api.herokuorinhtrtapp.com/";
/** Namespace for API calls to https://www.weatherapi.com/ */
export default class WeatherAPI {

  static async getWeatherOn(location:string, date: string): Promise<HistoryAPIResponse>{
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