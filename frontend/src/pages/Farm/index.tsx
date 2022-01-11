import FarmGrid from "../../components/FarmGrid";
import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useReducer } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import NotFound404 from "../../components/NotFound404";
import Forbidden403 from "../../components/Forbidden403";
import { cropArrToMatrix, cropMatrixToArr } from "../../utils";
import LoadingSpinner from "../../components/LoadingSpinner";
import FarmInfoPanel from "../../components/FarmInfoPanel";
import { Navigate } from "react-router-dom";
import FarmContext from "../../FarmContext";
import { Alert } from "reactstrap";
import { useAlert } from "../../hooks";
import GenericError from "../../components/GenericError";

export default function FarmPage(){
  const DEFAULT_CONTEXT_STATE = {
    farm : {id: 0, length: 0, width: 0, irrigationLVL: 0, lastCheckedAt : new Date(0),
    locName: "", locRegion: "", locCountry: "", cropMatrix: [] },
    activeGrid : {x: -1, y: -1}
  };
  
  const reducer = (state:any, action:any) => {
    switch (action.type){
      case "FARM_REPLACE": {
        state.farm = action.payload.farm;
        return {...state};
      }
      case "FARM_FIELD": {
        state.farm[action.payload.key] = action.payload.value;
        // if length or width is changed, rebuild the crop matrix
        if (action.payload.key === "length" || action.payload.key === "width"){
          const unpacked = cropMatrixToArr(state.farm.cropMatrix);
          state.farm.cropMatrix = cropArrToMatrix(unpacked, state.farm.length, state.farm.width);
        }
        return {...state};
      }
      case "CROP_REPLACE": {
        const {x, y} = action.payload;
        state.farm.cropMatrix[y][x] = action.payload.crop;
        return {...state};
      }
      case "CROP_UPDATE": {
        const {x, y} = action.payload;
        const updated = {...state.farm.cropMatrix[y][x], ...action.payload.crop };
        state.farm.cropMatrix[y][x] = updated;
        return {...state};
      }
      case "CROP_DELETE": {
        const {x, y} = action.payload;
        state.farm.cropMatrix[y][x] = null;
        return {...state};
      }
      case "ACTIVE_GRID": {
        return {...state, activeGrid: {...action.payload.activeGrid }};
      }
      default:
        return state;
    }
  };

  const { farmID } = useParams();
  const [state, dispatch] = useReducer(reducer, DEFAULT_CONTEXT_STATE)
  const [loading, setLoading] = useState(true);
  const [alertState, notify] = useAlert();
  const apiError = useRef<null|string|number>(null);
  
  /** Load in farm data */
  useEffect(() => {
    async function loadFarm(farmID:number){
      try {
        const res = await BerryFarmerAPI.getFarm(farmID);
        const farm = {
          id: res.id, length: res.length, width: res.width, irrigationLVL: res.irrigationLVL,
          lastCheckedAt : new Date(res.lastCheckedAt), locName: res.locationName,
          locRegion: res.locationRegion, locCountry: res.locationCountry,
          cropMatrix: cropArrToMatrix(res.crops, res.length, res.width)
        };
        dispatch({ type: "FARM_REPLACE", payload: { farm }});
        setLoading(false);
      } catch (err:any) {
        if (err.response){
          apiError.current = err.response.status;
        } else {
          apiError.current = err.message;
        }
        setLoading(false);
      }
    } 
    loadFarm(Number(farmID));
  }, [farmID]);

  /** Start 1 min timer for automatic sync calls (if we successfully pulled farm data from API) */
  useEffect(() => {
    async function syncFarm(farmID:number){
      try {
        const res = await BerryFarmerAPI.syncFarm(farmID);
        const farm = {
          id: res.id, length: res.length, width: res.width, irrigationLVL: res.irrigationLVL,
          lastCheckedAt : new Date(res.lastCheckedAt), locName: res.locationName,
          locRegion: res.locationRegion, locCountry: res.locationCountry,
          cropMatrix: cropArrToMatrix(res.crops, res.length, res.width)
        };
        dispatch({ type: "FARM_REPLACE", payload: { farm }});
      } catch (err) {
        console.debug("Attempted auto-sync with no crops on farm.");
      }
    };
    if (state.farm.id > 0){
      const timerID = setInterval(() => {
        syncFarm(state.farm.id);
      }, 60000);
      return () => { clearInterval(timerID); }
    }
  }, [state.farm.id]);
  
  // Handle error if api error
  if (apiError.current){
    switch (apiError.current){
      case 401:
        return <Navigate to="/login" />
      case 403:
        return <Forbidden403 />
      case 404:
        return <NotFound404 />
      default:
        return (
          (typeof apiError.current === "string") ? <GenericError errMsg={apiError.current} />
          : <GenericError errCode={apiError.current} />
        )
    }
  }

  return (
    <FarmContext.Provider value = { { state, dispatch } }>
      <main className="pt-5 pb-5 text-start">
        <div className="container">
          {loading ?
          <LoadingSpinner />
          :
          <div className="row">
            <div className="col-sm-8">
              <FarmGrid />
            </div>
            <div className="col-sm-4">
              <FarmInfoPanel notify={notify} />
              {alertState.msg &&
              <Alert
                color={alertState.color || "info"}
                toggle={() => { notify("") }}>
                {alertState.msg}
              </Alert>}
            </div>
          </div>
          }
        </div>
      </main>
  </FarmContext.Provider>)
}