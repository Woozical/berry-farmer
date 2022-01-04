import axios from "axios";
import type { Method } from "axios";
const BASE_URL = process.env.REACT_APP_BASE_URL || "http://localhost:3001";

interface RegisterPayload {
  username: string, password: string, email: string
}

interface LoginPayload {
  username: string, password: string
}

interface UpgradeFarmPayload {
  type: "length" | "width" | "irrigation"
}

// class SimpleHTTPError extends Error {
//   status: number
//   constructor(message:string, status:number){
//     super(message);
//     this.status = status;
//   }
// }

export default class BerryFarmerAPI {
  static token:string;

  // Wrapper method to include auth token, params, error-catching, etc. in axios request
  static async request(endpoint:string, method:Method="get", data={}){
    console.debug("API CALL:", endpoint, data, method);

    const url = `${BASE_URL}/${endpoint}`;
    const headers = { Authorization: `Bearer ${BerryFarmerAPI.token}`};
    const params = (method === "get") ? data : {};
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

  /** GET farm info */
  static async getFarm(farmID:number){
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
    const res = await this.request(`farms/${farmID}/upgrade`, "POST", data);
    return res.data.farm;
  }

  /** GET farms owned by */
  static async getFarmsOwnedBy(username:string){
    const res = await this.request(`users/${username}/farms`);
    return res.data.farms;
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
}