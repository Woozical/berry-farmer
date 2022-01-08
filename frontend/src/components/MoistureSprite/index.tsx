import spritesheet from "../../media/sprites/water_health.png";

interface MoistureSpriteProps {
  moisture: number
}

export default function MoistureSprite({moisture}:MoistureSpriteProps){
  let xOffset:number, yOffset:number;
  if (moisture >= 101){
    xOffset = Math.min(9, Math.floor(((moisture - 101) / 4))) * 128;
    yOffset = 128;
  } else {
    xOffset = Math.floor(moisture / 10) * 128;
    yOffset = moisture >= 100 ? 128 : 0;
  }
  // const xOffset = Math.floor((moisture / 10) % 10) * 128;
  // const yOffset = moisture > 99 ? 128 : 0;
  const style = {
    background: `url("${spritesheet}") -${xOffset}px -${yOffset}px`,
    width: "128px",
    height: "128px",
    zoom: 0.25
  };
  return <div style={style}></div>
}