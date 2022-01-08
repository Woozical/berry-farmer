import { Nav, NavItem, TabContent, TabPane, NavLink } from "reactstrap";
import { useState, useContext } from "react";
import FarmContext from "../../FarmContext";
import GlobalContext from "../../GlobalContext";
import CropDetailPane from "../CropDetailsPane";

export default function FarmInfoPanel(){
  const [activeTab, setActiveTab] = useState(1);
  const { state: { farm, activeGrid }} = useContext(FarmContext);
  const { currentUser } = useContext(GlobalContext);
  const crop = (activeGrid.x >= 0 && activeGrid.y >= 0) ? farm.cropMatrix[activeGrid.y][activeGrid.x] : null;
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
        {crop && <CropDetailPane crop={crop} />}
      </TabPane>
    </TabContent>
  
  </div>
  )
}