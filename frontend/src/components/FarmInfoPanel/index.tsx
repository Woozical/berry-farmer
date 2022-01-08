import { Nav, NavItem, TabContent, TabPane, NavLink } from "reactstrap";
import { useState, useContext } from "react";
import FarmContext from "../../FarmContext";
import GlobalContext from "../../GlobalContext";
import CropDetailPane from "../CropDetailsPane";
import BerryFarmerAPI from "../../BerryFarmerAPI";

export default function FarmInfoPanel(){
  const [activeTab, setActiveTab] = useState(1);
  const { dispatch, state: { farm, activeGrid }} = useContext(FarmContext);
  const { currentUser } = useContext(GlobalContext);
  const crop = (activeGrid.x >= 0 && activeGrid.y >= 0) ? farm.cropMatrix[activeGrid.y][activeGrid.x] : null;

  /** Function to send crop patch request to API with current active crop, and update local state  */
  const waterCrop = async (amount:number) => {
    if (!crop) return;
    const updatedCrop = await BerryFarmerAPI.waterCrop(crop.id, amount);
    dispatch({ type: "CROP_UPDATE", payload: {
      x: crop.x, y: crop.y,
      crop: { ...updatedCrop }
    }});
  };

  /** Function to send crop harvest request to API with current active crop, and update local state */
  const harvestCrop = async () => {
    if (!crop) return;
    const result = await BerryFarmerAPI.harvestCrop(crop.id);
    // send a notification someplace of harvest results
    // update farm
    dispatch({ type: "CROP_DELETE", payload: { x: crop.x, y: crop.y } });
  };

  return (
  <div>
    <Nav tabs>
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

    <TabContent className="mt-1" activeTab={activeTab}>
      <TabPane tabId={1}>
        Farm
      </TabPane>
      <TabPane tabId={2}>
        Inventory
      </TabPane>
      <TabPane tabId={3}>
        {crop && <CropDetailPane harvestCallback={harvestCrop} waterCallback={waterCrop} crop={crop} />}
      </TabPane>
    </TabContent>
  
  </div>
  )
}