import WeatherAPI from "../../utils/weatherAPI";
import axios from "axios";
import historyAPIRes from "../resources/weather-history-response.json";
import { NotFoundError } from "../../expressError";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;


describe("getWeatherOn", () => {
  const apiRes = {
    data : {
      location : { name : "London" },
      forecast : { 
        forecastday : [
          { date: "2020-02-20"}
        ]
       },
    },
    response : "yada yada"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch weather data for date", async () => {
    mockedAxios.get.mockResolvedValue(apiRes);
    const data = await WeatherAPI.getWeatherOn("London", "2020-02-20");
    expect(data.location.name).toEqual("London");
    expect(data.forecast.forecastday[0].date).toEqual("2020-02-20");
    expect(mockedAxios.get).toBeCalledTimes(1);
  });

  test("should make 3 attempts on connection error", async () => {
    const axiosRes = {msg: "Could not connect!" };
    mockedAxios.get.mockRejectedValue(axiosRes);
    try {
      await WeatherAPI.getWeatherOn("London", "2020-02-20");
      fail();
    } catch (err:any){
      expect(mockedAxios.get).toBeCalledTimes(4);
      expect(err.message).toContain("Exceded maximum reattempts");
    }
  });

  test("should make reattempts on 500 responses", async () => {
    const axiosRes = { response: { message: "server error!", status: 503 } }
    mockedAxios.get.mockRejectedValue(axiosRes);
    try {
      await WeatherAPI.getWeatherOn("London", "2020-02-20");
      fail();
    } catch (err:any){
      expect(mockedAxios.get).toBeCalledTimes(4);
      expect(err.response).not.toBeTruthy();
      expect(err.message).toContain("Exceded maximum reattempts");
    }
  });
  
  test("should not make reattempt on non-server/connection error, and preserve API response code", async () => {
    const axiosRes = { response: {message: "not found",  status: 404 }}
    mockedAxios.get.mockRejectedValue(axiosRes);
    try {
      await WeatherAPI.getWeatherOn("London", "2020-02-20");
      fail();
    } catch (err){
      expect(err).toBeInstanceOf(NotFoundError);
      expect(mockedAxios.get).toBeCalledTimes(1);
    }
  });

  test("should return data on successful reattempt", async () => {
    mockedAxios.get.mockRejectedValueOnce({ msg: "Could not connect!" });
    mockedAxios.get.mockRejectedValueOnce({ response: { message: "server overload!!!", status: 500 } });
    mockedAxios.get.mockResolvedValue(apiRes);
    const data = await WeatherAPI.getWeatherOn("London", "2020-02-20");
    expect(data.location.name).toEqual("London");
    expect(data.forecast.forecastday[0].date).toEqual("2020-02-20");
    expect(mockedAxios.get).toBeCalledTimes(3);
  });
});

describe("getWeatherBetween", () => {
  const apiRes = {
    data : {
      location : { name : "London" },
      forecast : { date : "2020-02-20" }
    },
    response : "yada yada"
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should fetch weather data between dates", async () => {
    /** 3 days */
    const start = new Date("Dec 20 2020");
    const end = new Date("Dec 22 2020");
    mockedAxios.get.mockResolvedValue(apiRes);
    const dataArr = await WeatherAPI.getWeatherBetween("London", start, end);
    expect(dataArr).toEqual([apiRes.data, apiRes.data, apiRes.data]);
    expect(mockedAxios.get).toBeCalledTimes(3);
  });
});

describe("summaryWeatherData", () => {
  test("works", () => {
    const res = WeatherAPI.summaryWeatherData(historyAPIRes);
    expect(res.date).toEqual("2021-12-10");
    expect(res.avgTemp).toBeCloseTo(6.7);
    expect(res.totalRainfall).toBeCloseTo(2.5);
    expect(res.avgCloud).toBeCloseTo(42.04);
    expect(res.name).toEqual("London");
    expect(res.region).toEqual("City of London, Greater London");
    expect(res.country).toEqual("United Kingdom");
  });
});