import FarmTile from "../FarmTile";
import GrassTile from "../GrassTile";

interface CropObject{
  berryType: string, moisture: number, curGrowthStage: number
}

interface FarmGridProps {
  length: number, width: number, crops: Array<CropObject>
}

export default function FarmGrid(props:FarmGridProps){
  const TOTAL_GRIDSIZE = 13;
  const matrix = Array.from(Array(TOTAL_GRIDSIZE), () => Array.from(Array(TOTAL_GRIDSIZE)));
  // Define the offsets, where our actual farm will begin on the grid (centered)
  // Everything else will be grass
  const farmStartX = Math.floor(0.5 * (TOTAL_GRIDSIZE-1)) - Math.floor(0.5 * props.width);
  const farmStartY = Math.floor(0.5 * (TOTAL_GRIDSIZE-1)) - Math.floor(0.5 * props.length);
  const farmEndX = farmStartX + props.width;
  const farmEndY = farmStartY + props.length;

  // Iterate through our matrix with data
  for (let i = 0; i < TOTAL_GRIDSIZE; i++){
    for (let j = 0; j < TOTAL_GRIDSIZE; j++){
      // Within farm coordinates
      if ((j >= farmStartX && j < farmEndX) && (i >= farmStartY && i < farmEndY)){
        matrix[i][j] = "f";
      // Outside farm coordnates
      } else {
        // Left border
        if (j+1 === farmStartX && i+1 >= farmStartY && i <= farmEndY){
          // top left corner?
          if(i+1 === farmStartY) matrix[i][j] = "tl";
          // bottom right corner?
          else if (i === farmEndY) matrix[i][j] = "bl";
          else matrix[i][j] = "l";
        }
        // Right border
        else if (j === farmEndX && i +1 > farmStartY && i <= farmEndY){
          // bottom right corner?
          if (i === farmEndY) matrix[i][j] = "br";
          else matrix[i][j] = "r";
        }
        // Top border
        else if (i+1 === farmStartY && j+1 > farmStartX && j <= farmEndX){
          // top right corner ?
          if (j === farmEndX) matrix[i][j] = "tr";
          else matrix[i][j] = "t";
        }
        // Bottom border
        else if (i === farmEndY && j+1 > farmStartX && j < farmEndX) matrix[i][j] = "b";
        else matrix[i][j] = "g";
      }
    }
  }

  const componentMatrix = matrix.map( row => {
    return (<tr>
      {row.map( cell => {
        if (cell === "f") return <FarmTile />
        else if (cell === "g") return <GrassTile withClutter={Math.random() < 0.1} />
        else return <GrassTile border={cell} />
      })}
    </tr>)
  })

  return (
    <div>
      <table>
        <tbody>
          {componentMatrix}
          {/* <tr>
            <GrassTile border="tl" />
            <GrassTile border="t" />
            <GrassTile border="t" />
            <GrassTile border="t" />
            <GrassTile border="tr" />
          </tr>
          <tr>
            <GrassTile border="l" />
            <FarmTile />
            <FarmTile crop={ { berryType: "cheri", moisture: 20 }} />
            <FarmTile />
            <GrassTile border="r" />
          </tr>
          <tr>
            <GrassTile border="l" />
            <FarmTile crop={ { berryType: "cheri", moisture: 20 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 80 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 100 }} />
            <GrassTile border="r" />
          </tr>
          <tr>
            <GrassTile border="l" />
            <FarmTile crop={ { berryType: "cheri", moisture: 20 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 40 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 60 }} />
            <GrassTile border="r" />
          </tr>
          <tr>
            <GrassTile border="bl" />
            <GrassTile border="b" />
            <GrassTile border="b" />
            <GrassTile border="b" />
            <GrassTile border="br" />
          </tr> */}
        </tbody>
      </table>
    </div>
  )
}