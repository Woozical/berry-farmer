import React from "react";
import type { CropObject } from "./BerryFarmerAPI";

interface FarmData {
  id: number, length: number, width: number, irrigationLVL: number,
  lastCheckedAt: Date, locName: string, locRegion: string, locCountry: string,
  cropMatrix: Array< Array<CropObject | undefined | null> >
}

interface ActiveGrid {
  x: number, y: number
}

interface IFarmContext {
  state: { farm: FarmData, activeGrid: ActiveGrid }, dispatch : Function
}

const DEFAULT_STATE = {
  farm : {id: 0, length: 0, width: 0, irrigationLVL: 0, lastCheckedAt : new Date(0),
  locName: "", locRegion: "", locCountry: "", cropMatrix: [] },
  activeGrid : {x: -1, y: -1}
};

const FarmContext = React.createContext<IFarmContext>({ state: DEFAULT_STATE, dispatch: () => {} });

export default FarmContext;