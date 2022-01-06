import spritesheet from "../../media/sprites/water_health.png";

interface MoistureSpriteProps {
  health: number
}

export default function MoistureSprite({health}:MoistureSpriteProps){
  const xOffset = Math.min(9, Math.floor(health / 10)) * 128;
  const style = {
    background: `url("${spritesheet}") -${xOffset}px -256px`,
    width: "128px",
    height: "128px",
    zoom: 0.25
  };
  return <div style={style}></div>
}