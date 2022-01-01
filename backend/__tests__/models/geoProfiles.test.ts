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
});

describe("filter method", () => {
  it("works", async () => {
    await db.query(
      `INSERT INTO geo_profiles (name, region, country)
       VALUES ('a0', 'b0', 'c0'),
              ('a1', 'b1', 'c1'),
              ('a11', 'b13', 'c14')`
    );
    let res = await GeoProfile.filter({ name: "a" });
    expect(res).toEqual([
      { id: expect.any(Number), name: "a0", region: "b0", country: "c0" },
      { id: expect.any(Number), name: "a1", region: "b1", country: "c1" },
      { id: expect.any(Number), name: "a11", region: "b13", country: "c14" },
    ]);
    res = await GeoProfile.filter({ name: "a1" });
    expect(res).toEqual([
      { id: expect.any(Number), name: "a1", region: "b1", country: "c1" },
      { id: expect.any(Number), name: "a11", region: "b13", country: "c14" },
    ]);
    res = await GeoProfile.filter({ region: "b", country: "4" });
    expect(res).toEqual([
      { id: expect.any(Number), name: "a11", region: "b13", country: "c14" },
    ]);
    res = await GeoProfile.filter({ region: "la-la-land", country: "4" });
    expect(res).toEqual([]);
    // with paging
    res = await GeoProfile.filter({ name: "a" }, 1, 1);
    expect(res).toEqual([
      { id: expect.any(Number), name: "a1", region: "b1", country: "c1" }
    ]);
  });

  it("throws BadRequestError on bad params", async () => {
    try {
      //@ts-ignore
      await GeoProfile.filter({ coolFactor: 9000 });
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  });
});

describe("get by ID method", () => {
  let locationID: number;
  beforeAll( async () => {
    const q = await db.query("SELECT id FROM geo_profiles LIMIT 1");
    locationID = q.rows[0].id;
  });

  it("works", async () => {
    const res = await GeoProfile.get(locationID);
    expect(res).toEqual({ id: locationID, name: "testN", region: "testR", country: "testC" });
  });

  it("throws NotFoundError if no such geoprofile", async () => {
    try{
      await GeoProfile.get(-1);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError)
    }
  });
});

describe("update method", () => {
  let locationID: number;
  beforeAll( async () => {
    const q = await db.query("SELECT id FROM geo_profiles LIMIT 1");
    locationID = q.rows[0].id;
  });

  it("works", async () => {
    const res = await GeoProfile.update(locationID, { name: "newName", region: "newRegion", country: "newCountry"});
    expect(res).toEqual({
      id: expect.any(Number),
      name: "newName",
      region: "newRegion",
      country: "newCountry",
      tzOffset: "0"
    });
    // reflected in db
    const q = await db.query("SELECT * FROM geo_profiles WHERE id = $1", [locationID]);
    expect(q.rows[0].name).toEqual("newName");
    expect(q.rows[0].region).toEqual("newRegion");
    expect(q.rows[0].country).toEqual("newCountry");
  });

  it("throws NotFoundError if no such geoprofile", async () => {
    try {
      await GeoProfile.update(-1, { name: "newName"});
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  })
});

describe("delete method", () => {
  let locationID: number;
  beforeAll( async () => {
    const q = await db.query("SELECT id FROM geo_profiles LIMIT 1");
    locationID = q.rows[0].id;
  });

  it("works", async () => {
    const res = await GeoProfile.delete(locationID);
    expect(res).toEqual({ deleted: locationID });
    const q = await db.query("SELECT * FROM geo_profiles WHERE id = $1", [locationID]);
    expect(q.rowCount).toEqual(0);
  });

  it("throws NotFoundError if no such geoprofile", async () => {
    try {
      await GeoProfile.delete(-1);
      fail();
    } catch(err) {
      expect(err).toBeInstanceOf(NotFoundError);
    }
  });

  it("throws BadRequestError if farms exist on this location", async () => {
    await db.query(`INSERT INTO users (username, email, password) VALUES ('u1', 'u1@mail.com', 'password')`)
    await db.query(`INSERT INTO farms (owner, location) VALUES ('u1', $1)`, [locationID]);
    try {
      await GeoProfile.delete(locationID);
      fail();
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
    }
  })
});

describe("getAll method", () => {
  beforeAll( async () => {
    await db.query(
      `INSERT INTO geo_profiles (name, region, country)
       VALUES ('a01', 'b', 'c'),
              ('a01', 'b2', 'c'),
              ('a01', 'b2', 'c2'),
              ('a04', 'b', 'c'),
              ('a05', 'b', 'c'),
              ('a06', 'b', 'c'),
              ('a07', 'b', 'c'),
              ('a08', 'b', 'c'),
              ('a09', 'b', 'c'),
              ('a10', 'b', 'c'),
              ('a11', 'b', 'c'),
              ('a12', 'b', 'c'),
              ('a13', 'b', 'c'),
              ('a14', 'b', 'c'),
              ('a15', 'b', 'c'),
              ('a16', 'b', 'c'),
              ('a17', 'b', 'c'),
              ('a18', 'b', 'c'),
              ('a19', 'b', 'c'),
              ('a20', 'b', 'c'),
              ('a21', 'b', 'c'),
              ('a22', 'b', 'c'),
              ('a23', 'b', 'c'),
              ('a24', 'b', 'c'),
              ('a25', 'b', 'c'),
              ('a26', 'b', 'c'),
              ('a27', 'b', 'c'),
              ('a28', 'b', 'c'),
              ('a29', 'b', 'c'),
              ('a30', 'b', 'c'),
              ('a31', 'b', 'c'),
              ('a32', 'b', 'c'),
              ('a33', 'b', 'c'),
              ('a34', 'b', 'c')`
    );
  });

  it("works with paging", async () => {
    const res = await GeoProfile.getAll();
    // Ordered by name, region, country
    expect(res[0]).toEqual({ id: expect.any(Number), name: "a01", region: "b", country: "c" });
    expect(res[1]).toEqual({ id: expect.any(Number), name: "a01", region: "b2", country: "c" });
    expect(res[2]).toEqual({ id: expect.any(Number), name: "a01", region: "b2", country: "c2" });
    expect(res.length).toBeLessThanOrEqual(GeoProfile.PAGE_LIMIT);
    const res2 = await GeoProfile.getAll(1, 20);
    expect(res2[0]).toEqual({ id: expect.any(Number), name: "a21", region: "b", country: "c" });
    expect(res2[res2.length-1]).toEqual({ id: expect.any(Number), name: "testN", region: "testR", country: "testC" });
  });
});