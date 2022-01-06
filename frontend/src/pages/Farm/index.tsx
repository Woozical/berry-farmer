import FarmGrid from "../../components/FarmGrid";
import { useParams } from "react-router-dom";
import { useEffect, useState, useContext, MouseEventHandler } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import NotFound404 from "../../components/NotFound404";
import { cropArrToMatrix } from "../../utils";
import type { FarmObject } from "../../BerryFarmerAPI";
import LoadingSpinner from "../../components/LoadingSpinner";
import FarmInfoPanel from "../../components/FarmInfoPanel";
import GlobalContext from "../../GlobalContext";

// this is rendering twice for some reason
export default function FarmPage(){
  const DEFAULT_FARM_STATE = { 
    id: -1, irrigationLVL: 0, lastCheckedAt: "", length: 0, width: 0, 
    locationCountry: "", locationName: "", locationRegion: "",
    owner: "", crops: []
  };
  const { currentUser } = useContext(GlobalContext);
  const { farmID } = useParams();
  const [farm, setFarm] = useState<FarmObject>(DEFAULT_FARM_STATE);
  const [activeCrop, setActiveCrop] = useState({});
  const [loading, setLoading] = useState(true);

  /** Load in farm data */
  useEffect(() => {
    async function loadFarm(farmID:number){
      const farm = await BerryFarmerAPI.getFarm(farmID);
      setFarm(farm);
      setLoading(false);
    } 
    loadFarm(Number(farmID));
  }, [farmID]);

  if (!farm) return <NotFound404 />;

  const changeActiveCrop = async (cropID:number) => {
    const crop = await BerryFarmerAPI.getCrop(cropID);
    setActiveCrop(crop);
  }

  const cropMatrix = cropArrToMatrix(farm.crops, farm.length, farm.width);
  return (<main>
    Farm View Page
    {loading ?
    <LoadingSpinner />
    :
    <div className="row">
      <div className="col-9">
        <FarmGrid clickCallback={changeActiveCrop} clutterChance={0} length={farm.length} width={farm.width} cropMatrix={cropMatrix} />
      </div>
      <div className="col-3">
        <FarmInfoPanel
          inventory = {currentUser.inventory}
          activeCrop = {activeCrop}
          activeFarm = {farm}
        />
      </div>
    </div>
  }
  </main>)
}