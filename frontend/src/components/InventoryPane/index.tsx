import React, { EventHandler, useContext } from "react";
import BerryIcon from "../BerryIcon";
import GlobalContext from "../../GlobalContext";
import FarmContext from "../../FarmContext";
import { ListGroupItem, ListGroup } from "reactstrap";
import { titleCase } from "../../utils";
import HelpPane from "../HelpPane";

interface InventoryPaneProps{
  plantCallback: Function
}

export default function InventoryPane (props:InventoryPaneProps) {
  const { currentUser } = useContext(GlobalContext);
  const { state: {farm, activeGrid} } = useContext(FarmContext);
  const crop = (activeGrid.x >= 0 && activeGrid.y >= 0) ? farm.cropMatrix[activeGrid.y][activeGrid.x] : null;

  const handleClick:EventHandler<any> = (evt) => {
    if (!crop && evt.target.id.includes("btn-plant")){
      const berryType = evt.target.id.split("-")[2];
      props.plantCallback(berryType);
    }
  };
  
  const berryListing = (berryType:string, last=false) => {
    if (!currentUser) return;
    const title = titleCase(berryType);
    const disabled = ( !(!crop) || activeGrid.y < 0 || activeGrid.x < 0);
    return  (
      <ListGroupItem className={`border-0 ${last ? "" : "border-bottom"}`} key={berryType}>
        <div className="row align-items-center justify-content-between text-start">
          <BerryIcon berryType={berryType} className="col-3 float-left" />
          <small className="col-6">{title} x{currentUser.inventory[berryType]}</small>
          <button id={`btn-plant-${berryType}`} disabled={disabled} className="col-3 btn btn-sm btn-primary">Plant</button>
        </div>
      </ListGroupItem>
    );
  };
  // If we have 0 of every berry in current user's inventory, show a help message instead
  const showInv = Object.values(currentUser!.inventory).some(v => v);

  return (showInv ? 
    <ListGroup onClick={handleClick}>
      {Object.keys(currentUser!.inventory).map( (berryType, idx, arr) => {
        return currentUser!.inventory[berryType] ? berryListing(berryType, (idx===arr.length-1)) : <React.Fragment key={berryType} />;
      })}
    </ListGroup>
    :
    <HelpPane type="inventory" />
  );
}