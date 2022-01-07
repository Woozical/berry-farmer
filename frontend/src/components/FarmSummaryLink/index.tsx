import type { FarmObjectSummary } from "../../BerryFarmerAPI";
import { Card, CardBody, CardTitle, CardSubtitle } from "reactstrap";
import { Link } from "react-router-dom"

interface FarmSummaryLinkProps {
  farm: FarmObjectSummary, deleteClick: Function
}

export default function FarmSummaryLink ( { farm, deleteClick }:FarmSummaryLinkProps) {

  const handleClick = () => {
    deleteClick(farm.id);
  }

  return (
    <Card className="text-start p-3">
      <CardTitle tag="h3" className="row">
        <div className="col-11">
          <Link to={`/farm/${farm.id}`}>
          {farm.locationName}, {farm.locationRegion}
          </Link>
        </div>
        <div className="col-1" onClick={handleClick} >
          <i className="bi text-danger bi-trash-fill"></i>          
        </div>
      </CardTitle>
      <CardSubtitle className="mb-2 text-muted" tag="h6">{farm.locationCountry}</CardSubtitle>
      <CardBody>
        {farm.width}x{farm.length} Farm <br /> Irrigation Level: {farm.irrigationLVL}
      </CardBody>
    </Card>
  )
}