import axios from "axios";
import db from "../../db";
import GeoProfile from "../../models/geoProfiles";
import API_RESPONSE from "../resources/weather-history-response.json";
import { commonAfterAll, commonAfterEach, commonBeforeEach } from "./_testCommon";
import { BadRequestError, NotFoundError } from "../../expressError";
import { hStringToDate } from "../../utils/helpers";
import HistoryAPIResponse from "../../schemas/HistoryAPIResponse";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(async () => {
    /** Wipe DB, minimal seeding required for testing this model */
    await db.query("DELETE FROM crops");
    await db.query("DELETE FROM farms");
    await db.query("DELETE FROM weather_data");
    await db.query("DELETE FROM user_inventories");
    await db.query("DELETE FROM berry_profiles");
    await db.query("DELETE FROM geo_profiles");
    await db.query("DELETE FROM users");
    const q = await db.query("INSERT INTO geo_profiles (name, region, country) VALUES ('testN', 'testR', 'testC') RETURNING id");
    await db.query(
      `INSERT INTO weather_data (location, date, avg_cloud, avg_temp, total_rainfall)
       VALUES ($1, '2021-12-08', 25.0, 30.0, 1.0),
              ($1, '2021-12-09', 35.0, 40.0, 2.0)`,
       [q.rows[0].id]);
});
beforeEach(commonBeforeEach);
afterAll(commonAfterAll);
afterEach(commonAfterEach);

describe("create method", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("works", async () => {
    mockedAxios.get.mockResolvedValue({data : API_RESPONSE });
    const res = await GeoProfile.create("london");
    expect(res).toEqual({
      id: expect.any(Number),
      name: "London",
      region: "City of London, Greater London",
      country: "United Kingdom"
    });

    // changes exist in db
    let q = await db.query("SELECT * FROM geo_profiles WHERE id = $1", [res.id]);
    expect(q.rowCount).toEqual(1);
    q = await db.query("SELECT * FROM weather_data WHERE location = $1", [res.id]);
    expect(q.rows[0].avg_temp).toEqual("6.7");
    expect(q.rows[0].total_rainfall).toEqual("2.5");
    expect(q.rows[0].avg_cloud).toContain("42.04");
  });

  it("gets timezone offset", async () => {
    mockedAxios.get.mockResolvedValue({ data: API_RESPONSE });
    jest.useFakeTimers("modern");
    // Server time is GMT-8, queried location is GMT+0
    jest.setSystemTime(new Date("2021-12-10 18:04"));
    const res = await GeoProfile.create("london");
    let q = await db.query("SELECT tz_offset FROM geo_profiles WHERE id = $1", [res.id]);
    expect(q.rows[0].tz_offset).toEqual("8");
  });

  it("throws BadRequestError if location already exists", async () => {
    try {
      await GeoProfile.create('london');
      await GeoProfile.create('london');
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("find id method", () => {
  it("works", async () => {
    const id = await GeoProfile.findID("testN", "testR", "testC");
    // proper id is found
    let q = await db.query("SELECT * FROM geo_profiles WHERE id = $1", [id]);
    expect(q.rowCount).toEqual(1);
    expect(q.rows[0].name).toEqual("testN");
    expect(q.rows[0].region).toEqual("testR");
    expect(q.rows[0].country).toContain("testC");
  });

  it("throws NotFoundError if search terms do not match a location", async () => {
    try {
      await GeoProfile.findID('testN', 'testR', 'testNotC');
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });
});

describe("get weather between", () => {
  let locationID:number;
  beforeAll(async () => {
    const q = await db.query("SELECT id FROM geo_profiles");
    locationID = q.rows[0].id;
  });

  afterEach( () => {
    jest.clearAllMocks();
  });

  it("works with all records in db", async () => {
    const d1 = hStringToDate("2021-12-08");
    const d2 = hStringToDate("2021-12-09");
    const resMap = await GeoProfile.getWeatherBetween(locationID, d1, d2);
    expect(resMap.get("2021-12-08")?.totalRain).toBeCloseTo(1);
    expect(resMap.get("2021-12-08")?.avgCloud).toBeCloseTo(25);
    expect(resMap.get("2021-12-09")?.totalRain).toBeCloseTo(2);
    expect(resMap.get("2021-12-09")?.avgTemp).toBeCloseTo(40);
  });

  it("works with one missing, end of date range", async () => {
    mockedAxios.get.mockResolvedValue({data : API_RESPONSE });
    const d1 = hStringToDate("2021-12-08");
    const d2 = hStringToDate("2021-12-10");
    const resMap = await GeoProfile.getWeatherBetween(locationID, d1, d2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(resMap.get("2021-12-08")?.totalRain).toBeCloseTo(1);
    expect(resMap.get("2021-12-08")?.avgCloud).toBeCloseTo(25);
    expect(resMap.get("2021-12-09")?.totalRain).toBeCloseTo(2);
    expect(resMap.get("2021-12-09")?.avgTemp).toBeCloseTo(40);
    expect(resMap.get("2021-12-10")?.totalRain).toBeCloseTo(2.5);
    expect(resMap.get("2021-12-10")?.avgTemp).toBeCloseTo(6.7);
  });

  it("works with one missing, middle of date range", async () => {
    await db.query(
      `INSERT INTO weather_data (location, date, avg_cloud, avg_temp, total_rainfall)
       VALUES ($1, '2021-12-11', 45, 50, 3.5)`, [locationID]
    );
    mockedAxios.get.mockResolvedValue({data : API_RESPONSE });
    const d1 = hStringToDate("2021-12-08");
    const d2 = hStringToDate("2021-12-11");
    const resMap = await GeoProfile.getWeatherBetween(locationID, d1, d2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(resMap.get("2021-12-08")).not.toBeUndefined();
    expect(resMap.get("2021-12-08")).not.toBeUndefined();
    expect(resMap.get("2021-12-09")).not.toBeUndefined();
    expect(resMap.get("2021-12-09")).not.toBeUndefined();
    expect(resMap.get("2021-12-10")?.totalRain).toBeCloseTo(2.5);
    expect(resMap.get("2021-12-10")?.avgTemp).toBeCloseTo(6.7);
    expect(resMap.get("2021-12-11")?.avgTemp).toBeCloseTo(50);
    expect(resMap.get("2021-12-11")?.totalRain).toBeCloseTo(3.5);
  });

  it("works with one missing, start of date range", async () => {
    await db.query(
      `INSERT INTO weather_data (location, date, avg_cloud, avg_temp, total_rainfall)
       VALUES ($1, '2021-12-11', 45, 50, 3.5),
              ($1, '2021-12-12', 55, 60, 4.5)`, [locationID]
    );
    mockedAxios.get.mockResolvedValue({data : API_RESPONSE });
    const d1 = hStringToDate("2021-12-10");
    const d2 = hStringToDate("2021-12-12");
    const resMap = await GeoProfile.getWeatherBetween(locationID, d1, d2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(resMap.get("2021-12-10")?.totalRain).toBeCloseTo(2.5);
    expect(resMap.get("2021-12-10")?.avgTemp).toBeCloseTo(6.7);
    expect(resMap.get("2021-12-11")?.avgTemp).toBeCloseTo(50);
    expect(resMap.get("2021-12-11")?.totalRain).toBeCloseTo(3.5);
    expect(resMap.get("2021-12-12")?.avgCloud).toBeCloseTo(55);
    expect(resMap.get("2021-12-12")?.avgTemp).toBeCloseTo(60);
  });

  it("works with multiple missing", async () => {

    const cloneWithDate = (obj:HistoryAPIResponse, date:string) : HistoryAPIResponse => {
      return {
        ...obj, forecast : {
          ...obj.forecast, forecastday: [
            {...obj.forecast.forecastday[0], date}
          ]
        }
      };
    }

    await db.query(
      `INSERT INTO weather_data (location, date, avg_cloud, avg_temp, total_rainfall)
       VALUES ($1, '2021-12-11', 45, 50, 3.5)`, [locationID]
    );
    const firstRes = cloneWithDate(API_RESPONSE, "2021-12-07");
    const lastRes = cloneWithDate(API_RESPONSE, "2021-12-12");

    mockedAxios.get.mockResolvedValueOnce({ data : firstRes });
    mockedAxios.get.mockResolvedValueOnce({ data : API_RESPONSE });
    mockedAxios.get.mockResolvedValueOnce({ data : lastRes });
    const d1 = hStringToDate("2021-12-07");
    const d2 = hStringToDate("2021-12-12");
    const resMap = await GeoProfile.getWeatherBetween(locationID, d1, d2);
    expect(mockedAxios.get).toHaveBeenCalledTimes(3);
    expect(resMap.get("2021-12-07")).not.toBeUndefined();
    expect(resMap.get("2021-12-08")).not.toBeUndefined();
    expect(resMap.get("2021-12-09")).not.toBeUndefined();
    expect(resMap.get("2021-12-10")).not.toBeUndefined();
    expect(resMap.get("2021-12-11")).not.toBeUndefined();
    expect(resMap.get("2021-12-12")).not.toBeUndefined();
  });
})