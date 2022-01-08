import React from "react";
import type { LoginPayload, RegisterPayload } from "./BerryFarmerAPI";

interface IGlobalContext {
  currentUser: any,
  login: (obj:LoginPayload) => Promise<any[]>,
  signup: (obj:RegisterPayload) => Promise<any[]>,
  logout: () => void,
  modInventory: (berryType:string, amountAdjust: number) => void
}

const DEFAULT_STATE = {
  currentUser: null,
  login: async (params:LoginPayload) => { return [null, null] },
  signup: async (params:RegisterPayload) => { return [null, null] },
  logout: () => {},
  modInventory: () => {}
};

const GlobalContext = React.createContext<IGlobalContext>(DEFAULT_STATE);
export default GlobalContext;