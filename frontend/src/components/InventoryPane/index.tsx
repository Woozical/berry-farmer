import React, { EventHandler, useContext } from "react";
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
  
  const berryListing = (berryType:string) => {
    const title = titleCase(berryType);
    const disabled = ( !(!crop) || activeGrid.y < 0 || activeGrid.x < 0);
    return  (
      <ListGroupItem key={berryType}>
        <div className="row align-items-center text-start">
          <img className="col-sm-3 float-left" src={`/assets/berries/${title}/${title}-icon.png`} alt={title} />
          <small className="col-sm-6">{title} x{currentUser.inventory[berryType]}</small>
          <button id={`btn-plant-${berryType}`} disabled={disabled} className="col-sm-2 btn btn-sm btn-primary">Plant</button>
        </div>
      </ListGroupItem>
    );
  };
  // If we have 0 of every berry in current user's inventory, show a help message instead
  const showInv = Object.values(currentUser.inventory).some(v => v);

  return (showInv ? 
    <ListGroup onClick={handleClick}>
      {Object.keys(currentUser.inventory).map(berryType => {
        return currentUser.inventory[berryType] ? berryListing(berryType) : <React.Fragment key={berryType} />;
      })}
    </ListGroup>
    :
    <HelpPane type="inventory" />
  );
}