import spritesheet from "../../media/sprites/farm_ground_2x.png";
import CropSprite from "../CropSprite";
import type { CropObject } from "../../BerryFarmerAPI";
import "./style.css";

interface FarmTileProps {
  crop?: CropObject, coordX: number, coordY: number
}

export default function FarmTile({ crop, coordX, coordY }:FarmTileProps){
  const spriteOffset = crop ? 32 * Math.min(5, Math.floor(crop.moisture / 20)) : 0;
  const style = {
    width: "32px", height: "32px",
    background: `url(${spritesheet}) -${spriteOffset}px 0px`,
  }
  return (
    <td className="FarmTile" data-x={coordX} data-y={coordY} style={style}>
      {crop && <CropSprite x={coordX} y={coordY} berryType={crop.berryType} curGrowthStage={crop.curGrowthStage} />}
    </td>
  )
}