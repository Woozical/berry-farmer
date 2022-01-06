import MoistureSprite from "../MoistureSprite";
import HealthSprite from "../HealthSprite";
import "./style.css";

interface CropDetailTooltipProps {
  health: number, moisture: number
}

export default function CropDetailTooltip({ health, moisture }:CropDetailTooltipProps){
  return <div className="CropDetailTooltip bg-light">
    <MoistureSprite moisture={moisture} />
    <HealthSprite health={health} />
  </div>
}