import BerryFarmerAPI from "../../BerryFarmerAPI";
import GlobalContext from "../../GlobalContext";
import { useContext, useEffect, useState, useRef } from "react";
import { useAuthenticated } from "../../hooks";
import type { FarmObjectSummary } from "../../BerryFarmerAPI";
import FarmSummaryLink from "../../components/FarmSummaryLink";
import NewFarmCard from "../../components/NewFarmCard";
import FarmDeleteConfirmModal from "../../components/FarmDeleteConfirmModal";
import FarmCreateForm from "../../components/FarmCreateForm";
import LoadingSpinner from "../../components/LoadingSpinner";
import { titleCase } from "../../utils";
import "./style.css";

export default function FarmListPage(){
  const MAX_FARMS = 3;
  const { currentUser, updateNumericField } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/login");
  const [farms, setFarms] = useState<FarmObjectSummary[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const activeDelete = useRef<null|number>(null);

  useEffect(() => {
    async function loadFarmList(){
      const farms = await BerryFarmerAPI.getUsersFarms(currentUser!.username);
      setFarms(farms);
      setLoading(false);
    }
    if (currentUser) loadFarmList();
  }, [currentUser]);

  const addToFarmList = (data:FarmObjectSummary) => {
    const newList = [...farms];
    newList.push({...data});
    setFarms(newList);
  };

  // This is a bit superfluous, as updating farmCount in currentUser will trigger the API call useEffect
  const removeFromFarmList = (farmID:number) => {
    const newList = farms.filter(farm => farm.id !== farmID);
    setFarms(newList);
  }

  const showDelete = (farmID:number) => {
    setShowDeleteConfirm(true);
    activeDelete.current = farmID;
  };

  const hideDelete = () => {
    setShowDeleteConfirm(false);
    activeDelete.current = null;
  };

  const showCreate = () => {
    setShowCreateForm(true);
  };

  const hideCreate = () => {
    setShowCreateForm(false);
  };

  const deleteFarm = async () => {
    if (!activeDelete.current) return;
    /** Errors are caught and handled in click handler in FarmDeleteConfirmModal */
    await BerryFarmerAPI.deleteFarm(activeDelete.current);
    removeFromFarmList(activeDelete.current);
    hideDelete();
    updateNumericField("farmCount", -1);
  };

  const createFarm = async (locationID:number) => {
    if (!currentUser) return;
    /** Errors are caught and handled in submit handler in FarmCreateForm */
    const farm = await BerryFarmerAPI.buyFarm(locationID);
    addToFarmList(farm);
    hideCreate();
    updateNumericField("farmCount", 1);
    updateNumericField("funds", -1000);
  };

  if (!auth) return redirect;

  return (
    <main className="pt-3 pb-2 FarmList">
      <FarmDeleteConfirmModal
        isOpen={showDeleteConfirm}
        confirmFunction={deleteFarm}
        toggleFunction={hideDelete}
      />
      <FarmCreateForm
        isOpen={showCreateForm}
        submitCallback={createFarm}
        toggleFunction={hideCreate}
      />
      <h1>{titleCase(currentUser!.username)}'s Farms</h1>
      <div className="container w-sm-50">
        <hr />
        { loading? <LoadingSpinner /> :
            <div>
              {farms.map( (farm) => {
                return <FarmSummaryLink key={farm.id} deleteClick={showDelete} farm={farm} />
              })}
              {farms.length < MAX_FARMS && <NewFarmCard onClick={showCreate} />}
            </div>
        }
      </div>
    </main>
  )
}