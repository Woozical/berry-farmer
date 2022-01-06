import FarmGrid from "../../components/FarmGrid";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import NotFound404 from "../../components/NotFound404";
import { cropArrToMatrix } from "../../utils";
import type { FarmObject } from "../../BerryFarmerAPI";
import LoadingSpinner from "../../components/LoadingSpinner";
import CropDetailTooltip from "../../components/CropDetailTooltip";


// this is rendering twice for some reason
export default function FarmPage(){
  const DEFAULT_FARM_STATE = { 
    id: -1, irrigationLVL: 0, lastCheckedAt: "", length: 0, width: 0, 
    locationCountry: "", locationName: "", locationRegion: "",
    owner: "", crops: []
  };
  const { farmID } = useParams();
  const [farm, setFarm] = useState<FarmObject>(DEFAULT_FARM_STATE);
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

  const cropMatrix = cropArrToMatrix(farm.crops, farm.length, farm.width);
  return (<main>
    Farm View Page
    {loading ? <LoadingSpinner /> : <FarmGrid length={farm.length} width={farm.width} cropMatrix={cropMatrix} />}
  </main>)
}