import FarmTile from "../FarmTile";

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
        matrix[i][j] = "X";
      // Outside farm coordnates
      } else {
        // Left border
        if (j+1 === farmStartX && i+1 >= farmStartY && i <= farmEndY){
          // top left corner?
          if(i+1 === farmStartY) matrix[i][j] = "B-TL";
          // bottom right corner?
          else if (i === farmEndY) matrix[i][j] = "B-BL";
          else matrix[i][j] = "B-L";
        }
        // Right border
        else if (j === farmEndX && i +1 > farmStartY && i <= farmEndY){
          // bottom right corner?
          if (i === farmEndY) matrix[i][j] = "B-BR";
          else matrix[i][j] = "B-R";
        }
        // Top border
        else if (i+1 === farmStartY && j+1 > farmStartX && j <= farmEndX){
          // top right corner ?
          if (j === farmEndX) matrix[i][j] = "B-TR";
          else matrix[i][j] = "B-T";
        }
        // Bottom border
        else if (i === farmEndY && j+1 > farmStartX && j < farmEndX) matrix[i][j] = "B-B";
        else matrix[i][j] = "G";
      }
    }
  }

  console.log(matrix);

  return (
    <div>
      <table>
        <tbody>
          <tr>
            <FarmTile />
            <FarmTile crop={ { berryType: "cheri", moisture: 20 }} />
            <FarmTile />
          </tr>
          <tr>
            <FarmTile crop={ { berryType: "cheri", moisture: 20 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 80 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 100 }} />
          </tr>
          <tr>
            <FarmTile crop={ { berryType: "cheri", moisture: 20 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 40 }} />
            <FarmTile crop={ { berryType: "cheri", moisture: 60 }} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}