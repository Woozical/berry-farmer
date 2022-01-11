import axios from "axios";
import type { Method } from "axios";
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3001";

export interface RegisterPayload {
  username: string, password: string, email: string
}

export interface LoginPayload {
  username: string, password: string
}

export interface FarmObject {
  id: number, irrigationLVL: number, lastCheckedAt: string, length: number
  locationCountry: string, locationName: string, locationRegion: string,
  owner: string, width: number, crops: Array<any>
}

export interface FarmObjectSummary {
  id: number, length: number, width: number, lastCheckedAt: string,
  irrigationLVL: number, locationName: string, locationRegion: string,
  locationCountry: string
}

export interface BerryProfileObject {
  name: string, growthTime: number, maxHarvest: number, size: number, pokeType: string,
  dryRate: number, pokePower: number, idealCloud: number, idealTemp: number
}

export interface CropObject {
  id: number, curGrowthStage: number, plantedAt: string, farmID: number,
  x: number, y: number, moisture: number, health: number, berryType: string
}

export interface CropObjectDetailed {
  id: number, curGrowthStage: number, plantedAt: string, farmID: number,
  x: number, y: number, moisture: number, health: number, berry: BerryProfileObject
}

export interface LocationObject { 
  id: number, name: string, region: string, country: string
}

interface UpgradeFarmPayload {
  type: "length" | "width" | "irrigation"
}

interface LocationParams {
  id?: number, name?: string, region?: string, country?: string, page?: number
}

interface CropPOSTPayload {
  x: number, y: number, farmID: number, berryType: string
}

export default class BerryFarmerAPI {
  static token:string;

  // Wrapper method to include auth token, params, error-catching, etc. in axios request
  static async request(endpoint:string, method:Method="get", data={}){
    console.debug("API CALL:", endpoint, data, method);
    const url = `${BASE_URL}/${endpoint}`;
    const headers = { Authorization: `Bearer ${BerryFarmerAPI.token}`};
    const params = (method.toLowerCase() === "get") ? data : {};
    try {
      return await axios({ url, data, params, headers, method });
    } catch (err:any) {
      console.error("API Error:", err);
      if (!err.response){
        throw new Error("Could not connect to BerryFarmer API at this time.");
      }
      throw err;
    }
  }

  // API routes
  /** Gets the base endpoint ("/") of API, which returns basic counts of users, farms and locations in DB */
  static async getSplash(){
    const res = await this.request("");
    return res.data;
  }

  /************************************************************** AUTH */

  /** POSTs to /auth/register with given data to create a new user account
   *  and returns an auth token that corresponds wth that user.
   */
  static async registerUser(data:RegisterPayload) {
    const res = await this.request(`auth/register`, "POST", data);
    return res.data.token;
  }

  /** POSTs to /auth/login with gven credentials to receive a new auth token */
  static async getToken(credentials:LoginPayload) {
    const res = await this.request(`auth/login`, "POST", credentials);
    return res.data.token;
  }

  /************************************************************** USERS */

  /** DELETE request to /users/:username to remove user with given username from DB.
   *  Auth token must be for said user, or an admin, for this operation to be permitted.
   */
  static async deleteUser(username:string){
    const res = await this.request(`users/${username}`, "DELETE");
    return res.data;
  }

  /** GET user info */
  static async getUser(username:string){
    const res = await this.request(`users/${username}`);
    return res.data.user;
  }

  /** GET farms owned by */
  static async getUsersFarms(username:string) : Promise<Array<FarmObjectSummary>>{
    const res = await this.request(`users/${username}/farms`);
    return res.data.farms;
  }

  /************************************************************** FARMS */

  /** GET farm info */
  static async getFarm(farmID:number):Promise<FarmObject>{
    let res = await this.request(`farms/${farmID}`);
    if (res.status === 211){
      res = await this.request(`farms/${farmID}/sync`, "POST");
    }
    return res.data.farm;
  }

  /** POST sync farm */
  static async syncFarm(farmID:number){
    const res = await this.request(`farms/${farmID}/sync`, "POST");
    return res.data.farm;
  }

  /** POST upgrade farm */
  static async upgradeFarm(farmID:number, data:UpgradeFarmPayload){
    try {
      const res = await this.request(`farms/${farmID}/upgrade`, "POST", data);
      return res.data.farm;
    } catch (err:any){
      throw new Error(err.response.data.error.message);
    }
  }

  /** DELETE farm */
  static async deleteFarm(farmID:number){
    const res = await this.request(`farms/${farmID}`, "DELETE");
    return res.data;
  }

  /** POST farm/buy */
  static async buyFarm(locationID:number){
    const res = await this.request("farms/buy", "POST", { locationID });
    return res.data.farm;
  }

  /************************************************************** CROPS */

  // { x: number, y: number, farmID: number, berryType: string }
  static async plantCrop(data:CropPOSTPayload){
    const res = await this.request("crops", "POST", data);
    return res.data.crop;
  }

  static async harvestCrop(cropID:number){
    const res = await this.request(`crops/${cropID}/harvest`, "POST");
    return res.data.harvest;
  }

  static async waterCrop(cropID:number, amount:Number, farmID:number) : Promise<CropObject>{
    const res = await this.request(`crops/${cropID}`, "PATCH", { moisture: amount });
    if (res.status === 211){
      await this.syncFarm(farmID);
      return this.waterCrop(cropID, amount, farmID);
    }
    return res.data.crop;
  }

  static async deleteCrop(cropID:number){
    const res = await this.request(`crops/${cropID}`, "DELETE");
    return res.data;
  }

  static async getCrop(cropID:number){
    const res = await this.request(`crops/${cropID}`);
    return res.data.crop;
  }

  /************************************************************** BERRIES */

  static async getBerryPrices(){
    const res = await this.request("berries/prices");
    return { prices: res.data.prices, hot: res.data.hot, not: res.data.not };
  }

  static async getBerryProfile(berryType:string) : Promise<BerryProfileObject>{
    const res = await this.request(`berries/${berryType}`);
    return res.data.berry;
  }

  static async berryTransaction(transaction:"buy"|"sell", berryType:string, amount: number){
    const res = await this.request(`berries/${transaction}`, "POST", { berryType, amount });
    return res.data;
  }

  /************************************************************** LOCATIONS */

  /** GET location
   *  Returns a single location object if ID is supplied,
   *  otherwise, returns an array of location objects matching the given parameters
   */
  static async getLocations(params:LocationParams){
    if (params.id){
      const res = await this.request(`locations/${params.id}`);
      return res.data.location;
    } else {
      const res = await this.request("locations", "GET", params);
      return res.data.locations;
    }
  }

  /** POST location/create */
  static async createLocation(search:string): Promise<LocationObject>{
    try {
      // Send request to find a location from WeatherAPI and create it in BerryFarmerAPI using our search term
      const res = await this.request("locations", "POST", { search });
      return res.data.location;
    } catch (err:any) {
      if (err.response && err.response.data.error.message.includes("already exists")){
        const message = err.response.data.error.message;
        // Bad request and location already exists, grab existing location from error message
        const [name, region, country] = message.split("(")[1].split(")")[0].split("|");
        // Look up locaton object from API
        const [ location ] = await this.getLocations({ name, region, country });
        // Return a match if we got it
        if (location) return location;
      }
      // Throw message from server if other type of bad request
      else if (err.response && err.response.data.error.status === 400){
        throw new Error(err.response.data.error.message);
      }
      // Throw original error if we reach here
      throw err;
    }
  }
}