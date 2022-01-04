import spritesheet from "../../media/sprites/farm_ground_2x.png";
import CropSprite from "../CropSprite";
import "./style.css";

interface CropObject {
  moisture: number,
  berryType: string
}

interface FarmTileProps {
  crop?: CropObject
}

export default function FarmTile({ crop }:FarmTileProps){
  const spriteOffset = crop ? 32 * Math.min(5, Math.floor(crop.moisture / 20)) : 0;
  const bgSprite = {
    width: "32px", height: "32px",
    background: `url(${spritesheet}) -${spriteOffset}px 0px`,
  }
  return (
    <td className="FarmTile" style={bgSprite}>
      {crop && <CropSprite berryType={crop.berryType} curGrowthStage={Math.floor(Math.random() * 5)} />}
    </td>
  )
}