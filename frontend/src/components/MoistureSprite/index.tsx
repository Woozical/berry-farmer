import spritesheet from "../../media/sprites/water_health.png";

interface MoistureSpriteProps {
  moisture: number
}

export default function MoistureSprite({moisture}:MoistureSpriteProps){
  const xOffset = Math.floor((moisture / 10) % 10) * 128;
  const yOffset = Math.min(1, Math.floor(moisture / 95)) * 128;
  const style = {
    background: `url("${spritesheet}") -${xOffset}px -${yOffset}px`,
    width: "128px",
    height: "128px",
    zoom: 0.25
  };
  return <div style={style}></div>
}