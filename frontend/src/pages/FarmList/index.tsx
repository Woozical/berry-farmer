import BerryFarmerAPI from "../../BerryFarmerAPI";
import GlobalContext from "../../GlobalContext";
import { useContext, useEffect, useState } from "react";
import { useAuthenticated } from "../../hooks";
import type { FarmObjectSummary } from "../../BerryFarmerAPI";
import FarmSummaryLink from "../../components/FarmSummaryLink";
import NewFarmCard from "../../components/NewFarmCard";
import FarmDeleteConfirmModal from "../../components/FarmDeleteConfirmModal";

export default function FarmListPage(){
  const MAX_FARMS = 3;
  const { currentUser } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/login");
  const [farms, setFarms] = useState<FarmObjectSummary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect( () => {
    async function loadFarmList(){
      const farms = await BerryFarmerAPI.getUsersFarms(currentUser.username);
      setFarms(farms);
    }
    if (currentUser) loadFarmList();
  }, [currentUser]);

  const addToFarmList = (data:FarmObjectSummary) => {
    const newList = [...farms];
    newList.push({...data});
    setFarms(newList);
  };

  const showDelete = (farmID:number) => {
    setShowDeleteConfirm(true);
  }

  if (!auth) return redirect;

  return (
    <main>
      <FarmDeleteConfirmModal
        isOpen={showDeleteConfirm}
        confirmFunction={() => {}}
        toggleFunction={() => { setShowDeleteConfirm(false); }}
      />
      <h1>{currentUser.username}'s Farms</h1>
      <ul>
        {farms.map( (farm) => {
          return <li key={farm.id}><FarmSummaryLink deleteClick={showDelete} farm={farm} /></li>
        })}
        {farms.length < MAX_FARMS && <NewFarmCard />}
      </ul>
    </main>
  )
}