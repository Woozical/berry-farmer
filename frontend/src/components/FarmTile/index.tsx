import spritesheet from "../../media/sprites/farm_ground_2x.png";
import CropSprite from "../CropSprite";
import type { CropObject } from "../../BerryFarmerAPI";
import FarmContext from "../../FarmContext";
import { useContext } from "react";
import "./style.css";

interface FarmTileProps {
  crop?: CropObject, coordX: number, coordY: number
}

export default function FarmTile({ crop, coordX, coordY }:FarmTileProps){
  const spriteOffset = crop ? 32 * Math.min(5, Math.floor(crop.moisture / 20)) : 0;
  const style = {
    width: "32px", height: "32px",
    background: `url(${spritesheet}) -${spriteOffset}px 0px`,
  };
  const { dispatch, state: {activeGrid} } = useContext(FarmContext);
  const isActive = (coordX === activeGrid.x && coordY === activeGrid.y);
  const handleClick = () => {
    const newActiveGrid = crop ? { x: coordX, y: coordY, cropID: crop.id} : { x: coordX, y: coordY };
    dispatch({ type: "ACTIVE_GRID", payload: { activeGrid: isActive ? {x: -1, y: -1} : newActiveGrid }});
  };

  return (
    <td onClick={handleClick} className={`FarmTile${isActive ? " active" : ""}`} style={style}>
      {crop && <CropSprite x={coordX} y={coordY} berryType={crop.berryType} curGrowthStage={crop.curGrowthStage} />}
    </td>
  )
}