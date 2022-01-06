import BerryFarmerAPI from "../../BerryFarmerAPI";
import GlobalContext from "../../GlobalContext";
import { useContext, useEffect, useState } from "react";
import { useAuthenticated } from "../../hooks";
import type { FarmObjectSummary } from "../../BerryFarmerAPI";
import FarmSummaryLink from "../../components/FarmSummaryLink";

export default function FarmListPage(){
  const { currentUser } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/login");
  const [farms, setFarms] = useState<FarmObjectSummary[]>([]);

  useEffect( () => {
    async function loadFarmList(){
      const farms = await BerryFarmerAPI.getUsersFarms(currentUser.username);
      setFarms(farms);
    }
    loadFarmList();
  }, []);

  if (!auth) return redirect;

  return (
    <main>
      <h1>{currentUser.username}'s Farms</h1>
      <ul>
        {farms.map( farm => {
          return <li key={farm.id}><FarmSummaryLink farm={farm} /></li>
        })}
      </ul>
    </main>
  )
}