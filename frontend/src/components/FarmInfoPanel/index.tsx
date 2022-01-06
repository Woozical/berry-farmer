import { Nav, NavItem, TabContent, TabPane } from "reactstrap";
import { useState } from "react";

interface FarmInfoPanelProps {
  inventory: any, activeFarm: any, activeCrop: any
}

export default function FarmInfoPanel({ inventory, activeFarm, activeCrop }:FarmInfoPanelProps){
  const [activeTab, setActiveTab] = useState(1);

  return (
  <div>
    <Nav tabs>
      <NavItem
        className={activeTab === 1 ? "active" : ""}
        onClick={ () => { setActiveTab(1) }}
      >
        Frm
      </NavItem>
      <NavItem
        className={activeTab === 2 ? "active" : ""}
        onClick={ () => { setActiveTab(2) }}
      >
        Inv
      </NavItem>
      <NavItem
        className={activeTab === 3 ? "active" : ""}
        onClick={ () => { setActiveTab(3) }}
      >
        Crop
      </NavItem>
    </Nav>
    <TabContent activeTab={activeTab}>
      <TabPane tabId={1}>
        Farm
      </TabPane>
      <TabPane tabId={2}>
        Inventory
      </TabPane>
      <TabPane tabId={3}>
        Crop
      </TabPane>
    </TabContent>
  </div>
  )
}