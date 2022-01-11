import { Nav, NavItem, TabContent, TabPane, NavLink } from "reactstrap";
import { useState, useContext } from "react";
import FarmContext from "../../FarmContext";
import GlobalContext from "../../GlobalContext";
import CropDetailsPane from "../CropDetailsPane";
import HelpPane from "../HelpPane";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import InventoryPane from "../InventoryPane";
import FarmDetailsPane from "../FarmDetailsPane";

interface FarmInfoPanelProps {
  notify: Function
}

export default function FarmInfoPanel(props:FarmInfoPanelProps){
  const [activeTab, setActiveTab] = useState(3);
  const { dispatch, state: { farm, activeGrid }} = useContext(FarmContext);
  const { currentUser, modInventory } = useContext(GlobalContext);
  const crop = (activeGrid.x >= 0 && activeGrid.y >= 0) ? farm.cropMatrix[activeGrid.y][activeGrid.x] : null;

  /** Function to send upgrade request to API */
  const upgradeFarm = async (type:"length"|"width"|"irrigation") => {
    if (type === "width" && farm.width >= 9) return;
    if (type === "length" && farm.length >= 9) return;
    if (type === "irrigation" && farm.irrigationLVL >= 5) return;
    try {
      const updatedFarm = await BerryFarmerAPI.upgradeFarm(farm.id, { type });
      const key = type === "irrigation" ? "irrigationLVL" : type;
      const value = updatedFarm[key];
      dispatch({ type: "FARM_FIELD", payload: {
        key, value
      }});
      props.notify(`Upgraded ${type}`, "info");
    } catch (err:any) {
      console.error(err);
      props.notify(err.message ? err.message : "Error", "danger");
    }
  }

  /** Function to send crop patch request to API with current active crop, and update local state  */
  const waterCrop = async (amount:number) => {
    if (!crop) return;
    try {
      const updatedCrop = await BerryFarmerAPI.waterCrop(crop.id, amount, farm.id);
      dispatch({ type: "CROP_UPDATE", payload: {
        x: crop.x, y: crop.y,
        crop: { ...updatedCrop }
      }});
    } catch (err:any) {
      console.error(err);
      props.notify(err.message ? err.message : "Error", "danger");
    }
  };

  /** Function to send crop harvest request to API with current active crop, and update local state */
  const harvestCrop = async () => {
    if (!crop) return;
    try {
      const harvest = await BerryFarmerAPI.harvestCrop(crop.id);
      // send a notification someplace of harvest results
      // update farm
      dispatch({ type: "CROP_DELETE", payload: { x: crop.x, y: crop.y } });
      modInventory(harvest.berryType, harvest.amount);
      props.notify(`Harvested ${harvest.amount} ${harvest.berryType} berr${harvest.amount === 1 ? 'y' : 'ies'}.`, "success");
    } catch (err:any) {
      console.error(err);
      props.notify(err.message ? err.message : "Error", "danger");
    }
  };

  const deleteCrop = async () => {
    if (!crop) return;
    try {
      await BerryFarmerAPI.deleteCrop(crop.id);
      const { berryType, curGrowthStage } = crop;
      dispatch({ type: "CROP_DELETE", payload: { x: crop.x, y: crop.y } });
      props.notify(`Destroyed ${berryType} ${['seed', 'sapling', 'plant', 'tree', 'harvest'][curGrowthStage]}.`, "warning")
    } catch (err:any) {
      console.error(err);
      props.notify(err.message ? err.message : "Error", "danger");
    }
  };

  const plantCrop = async (berryType:string) => {
    if (!currentUser || currentUser.inventory[berryType] < 1) return;
    try {
      const {x, y} = activeGrid;
      const planted = await BerryFarmerAPI.plantCrop({ farmID: farm.id, x, y, berryType });
      dispatch({ type: "CROP_REPLACE", payload: { x, y, crop: planted } });
      modInventory(berryType, -1);
      props.notify(`Planted a ${berryType} berry.`);
    } catch (err:any) {
      console.error(err);
      props.notify(err.message ? err.message : "Error", "danger");
    }
  };

  return (
  <div>
    <Nav justified tabs>
      <NavItem>
        <NavLink
          className={activeTab === 1 ? "active" : ""}
          onClick={ () => { setActiveTab(1) }}
        >
          Farm
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          className={activeTab === 2 ? "active" : ""}
          onClick={ () => { setActiveTab(2) }}     
        >
          Inventory
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          className={activeTab === 3 ? "active" : ""}
          onClick={ () => { setActiveTab(3) }}
        >
          Crop
        </NavLink>
      </NavItem>
    </Nav>

    <TabContent className="pt-1 bg-white border-start border-end border-bottom" activeTab={activeTab}>
      <TabPane tabId={1}>
        <FarmDetailsPane upgradeCallback={upgradeFarm} />
      </TabPane>
      <TabPane tabId={2}>
        <InventoryPane plantCallback={plantCrop} />
      </TabPane>
      <TabPane tabId={3}>
        {crop ?
          <CropDetailsPane deleteCallback={deleteCrop} harvestCallback={harvestCrop} waterCallback={waterCrop} crop={crop} />
        :
          <HelpPane type="crop" />}
      </TabPane>
    </TabContent>
  
  </div>
  )
}