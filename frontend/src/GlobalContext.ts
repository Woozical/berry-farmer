import React from "react";
import type { LoginPayload, RegisterPayload } from "./BerryFarmerAPI";

export interface ICurrentUser {
  username: string, farmCount: number, funds: number, email: string,
  inventory: any
}

interface IGlobalContext {
  currentUser: ICurrentUser|null,
  login: (obj:LoginPayload) => Promise<any[]>,
  signup: (obj:RegisterPayload) => Promise<any[]>,
  logout: () => void,
  modInventory: (berryType:string, amountAdjust: number) => void
  updateNumericField: (key: "farmCount" | "funds", amountAdjust:number) => void
}

const DEFAULT_STATE = {
  currentUser: null,
  login: async (params:LoginPayload) => { return [null, null] },
  signup: async (params:RegisterPayload) => { return [null, null] },
  logout: () => {},
  modInventory: () => {},
  updateNumericField: () => {}
};

const GlobalContext = React.createContext<IGlobalContext>(DEFAULT_STATE);
export default GlobalContext;