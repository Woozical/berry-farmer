import spritesheet from "../../media/sprites/farm_ground_2x.png";
import ClutterSprite from "../ClutterSprite";
import { memo } from "react";

interface GrassTileProps{
  clutterChance?: number,
  border?: "l" | "r" | "b" | "t" | "tl" | "tr" | "bl" | "br"
}

export default memo(function GrassTile(props:GrassTileProps){
  let spriteOffsetX:number, spriteOffsetY:number;
  const borderOffsets = {
    l: [0, 2], r: [1, 2], b: [2, 2], t: [3, 2],
    tl: [0, 3], tr: [1, 3], bl: [2, 3], br: [3, 3]
  };
  if (props.border){
    [spriteOffsetX, spriteOffsetY] = [...borderOffsets[props.border].map(v => v * 32)];
  } else {
    [spriteOffsetX, spriteOffsetY] = [(32 * Math.floor(Math.random() * 4)), 32]
  }
  const bgSprite = {
    width: "32px", height: "32px",
    background: `url(${spritesheet}) -${spriteOffsetX}px -${spriteOffsetY}px`,
  }
  return (
    <td style={bgSprite}>
      {props.clutterChance && (Math.random() < props.clutterChance) && <ClutterSprite />}
    </td>
  )
});