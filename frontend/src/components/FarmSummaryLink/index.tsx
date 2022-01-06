import type { FarmObjectSummary } from "../../BerryFarmerAPI";
import { Card, CardBody, CardTitle, CardSubtitle } from "reactstrap";
import { Link } from "react-router-dom"

interface FarmSummaryLinkProps {
  farm: FarmObjectSummary
}

export default function( { farm }:FarmSummaryLinkProps) {
  return (
  <div>
    <Card className="text-start p-3">
      <CardTitle tag="h3">
        <Link className="stretched-link" to={`/farm/${farm.id}`}>
        {farm.locationName}, {farm.locationRegion}
        </Link>
      </CardTitle>
      <CardSubtitle className="mb-2 text-muted" tag="h6">{farm.locationCountry}</CardSubtitle>
      <CardBody>
        {farm.width}x{farm.length} Farm <br /> Irrigation Level: {farm.irrigationLVL}
      </CardBody>
    </Card>
  </div>
  )
}