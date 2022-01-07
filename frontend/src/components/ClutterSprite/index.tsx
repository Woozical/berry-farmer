import spritesheet from "../../media/sprites/farm_ground_2x.png";
import { memo } from "react";
export default memo(function ClutterSprite(){
  const [spriteOffsetX, spriteOffsetY] = [(32 * Math.floor(Math.random() * 6)), (4 * 32)];
  const style = {
    height: "100%",
    width: "100%",
    background: `url("${spritesheet}") -${spriteOffsetX}px -${spriteOffsetY}px`,
  };
  return <div style={style}></div>
});