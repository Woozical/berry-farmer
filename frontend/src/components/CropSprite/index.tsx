import { titleCase } from "../../utils";
interface CropSpriteProps {
  berryType: string, curGrowthStage: number, x?:number, y?: number
}
export default function CropSprite({ berryType, curGrowthStage, x, y }:CropSpriteProps){
  let filePath:string;
  const fpb = titleCase(berryType);
  switch (curGrowthStage){
    case 0:
      filePath = "/assets/berries/all/seed.png";
      break;
    case 1:
      filePath = "/assets/berries/all/sprout.png";
      break;
    case 2:
      filePath = `/assets/berries/${fpb}/${fpb}TreeTaller.png`;
      break;
    case 3:
      filePath = `/assets/berries/${fpb}/${fpb}TreeBloom.png`;
      break;
    case 4:
      filePath = `/assets/berries/${fpb}/${fpb}TreeBerry.png`;
      break;
    default:
      throw new Error("Expected CropSprite prop: curGrowthStage to be 0-4")
  }

  const style = {
    height: "100%",
    width: "100%",
    background: `url(${filePath}) no-repeat center`,
  }

  return <div data-x={x || 0} data-y={y || 0} style={style}></div>
}