import FarmTile from "../FarmTile";
import GrassTile from "../GrassTile";
import { useContext } from "react";
import FarmContext from "../../FarmContext";

function FarmGrid(){
  const { state: { farm } } = useContext(FarmContext);
  const TOTAL_GRIDSIZE = 13;
  // Create empty component matrix
  const matrix = Array.from(Array(TOTAL_GRIDSIZE), () => Array.from(Array(TOTAL_GRIDSIZE)));
  
  // Define the offsets, where our actual farm will begin on the grid (centered)
  // Everything else will be grass
  const farmStartX = Math.floor(0.5 * (TOTAL_GRIDSIZE-1)) - Math.floor(0.5 * farm.width);
  const farmStartY = Math.floor(0.5 * (TOTAL_GRIDSIZE-1)) - Math.floor(0.5 * farm.length);
  const farmEndX = farmStartX + farm.width;
  const farmEndY = farmStartY + farm.length;

  // Iterate through our matrix, assigning components for each row
  for (let i = 0; i < TOTAL_GRIDSIZE; i++){
    for (let j = 0; j < TOTAL_GRIDSIZE; j++){
      let key = `tile-${j}-${i}`;
      // Within farm coordinates
      if ((j >= farmStartX && j < farmEndX) && (i >= farmStartY && i < farmEndY)){
        const localX = j - farmStartX;
        const localY = i - farmStartY;
        const crop = farm.cropMatrix[localY][localX] || undefined;
        if (crop) key = `crop-${crop.id}`;
        matrix[i][j] = <FarmTile key={key} coordX={localX} coordY={localY} crop={crop} />
      }
      // Outside farm coordnates
      else {
        // Left border
        if (j+1 === farmStartX && i+1 >= farmStartY && i <= farmEndY){
          // top left corner?
          if(i+1 === farmStartY) matrix[i][j] = <GrassTile key={key} border="tl" />;
          // bottom right corner?
          else if (i === farmEndY) matrix[i][j] = <GrassTile key={key} border="bl" />;
          else matrix[i][j] = <GrassTile key={key} border="l" />;
        }
        // Right border
        else if (j === farmEndX && i +1 > farmStartY && i <= farmEndY){
          // bottom right corner?
          if (i === farmEndY) matrix[i][j] = <GrassTile key={key} border="br" />;
          else matrix[i][j] = <GrassTile key={key} border="r" />;
        }
        // Top border
        else if (i+1 === farmStartY && j+1 > farmStartX && j <= farmEndX){
          // top right corner ?
          if (j === farmEndX) matrix[i][j] = <GrassTile key={key} border="tr" />;
          else matrix[i][j] = <GrassTile key={key} border="t" />;
        }
        // Bottom border
        else if (i === farmEndY && j+1 > farmStartX && j < farmEndX) matrix[i][j] = <GrassTile key={key} border="b" />;
        else matrix[i][j] = <GrassTile key={key} clutterChance={0.1} />;
      }
    }
  }

  return (
    <table>
      <tbody>
        {matrix.map( (row, idx) => { return <tr key={`row-${idx}`}>{row}</tr> } )}
      </tbody>
    </table>
  )
}

FarmGrid.defaultProps = {
  length: 3,
  width: 3,
  cropMatrix: []
}

export default FarmGrid;