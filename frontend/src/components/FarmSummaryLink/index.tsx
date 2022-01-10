import type { FarmObjectSummary } from "../../BerryFarmerAPI";
import { Card, CardBody, CardTitle, CardSubtitle } from "reactstrap";
import { Link } from "react-router-dom"
import "./style.css";

interface FarmSummaryLinkProps {
  farm: FarmObjectSummary, deleteClick: Function
}

export default function FarmSummaryLink ( { farm, deleteClick }:FarmSummaryLinkProps) {

  const handleClick = () => {
    deleteClick(farm.id);
  }

  return (
    <Card className="FarmSummaryLink text-start p-3">
      <CardTitle tag="h5" className="row justify-content-between">
        <div className="col-11">
          <Link className="text-decoration-none" to={`/farm/${farm.id}`}>
          {farm.locationName}, {farm.locationRegion}
          </Link>
        </div>
        <div className="col-1" onClick={handleClick} >
          <i className="bi text-danger bi-trash-fill FarmSummaryLink-DeleteIcon"></i>          
        </div>
      </CardTitle>
      <CardSubtitle className="mb-2 text-muted">{farm.locationCountry}</CardSubtitle>
      <CardBody>
        <small>{farm.width}x{farm.length} Farm <br /> Irrigation Level: {farm.irrigationLVL}/5</small>
      </CardBody>
    </Card>
  )
}