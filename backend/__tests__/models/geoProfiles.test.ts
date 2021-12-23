import axios from "axios";
import db from "../../db";
import GeoProfile from "../../models/geoProfiles";
import API_RESPONSE from "../resources/weather-history-response.json";
import { commonAfterAll, commonAfterEach, commonBeforeEach } from "./_testCommon";
import { BadRequestError, NotFoundError } from "../../expressError";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(async () => {
    /** Wipe DB, no seeding required for testing this model */
    await db.query("DELETE FROM crops");
    await db.query("DELETE FROM farms");
    await db.query("DELETE FROM weather_data");
    await db.query("DELETE FROM user_inventories");
    await db.query("DELETE FROM berry_profiles");
    await db.query("DELETE FROM geo_profiles");
    await db.query("DELETE FROM users");
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
  beforeAll( async () => {
    await db.query("INSERT INTO geo_profiles (name, region, country) VALUES ('testN', 'testR', 'testC')");
  });

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