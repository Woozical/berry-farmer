import FarmContext from "../../FarmContext";
import { Card, CardTitle, CardSubtitle, CardBody } from "reactstrap";
import { EventHandler, useContext } from "react";

interface FarmDetailsPaneProps{
  upgradeCallback: (type:"length"|"width"|"irrigation") => void
}

export default function FarmDetailsPane(props:FarmDetailsPaneProps){
  const { state: {farm }} = useContext(FarmContext);

  const handleClick:EventHandler<any> = (evt) => {
    if (evt.target.id.includes('btn-upgrade')){
      const type = evt.target.id.split('-')[2];
      props.upgradeCallback(type);
    }
  };

  return (
    <Card className="text-center">
      <CardTitle tag="h5">{farm.locName}, {farm.locRegion}</CardTitle>
      <CardSubtitle tag="h6" className="text-muted mt-1">{farm.locCountry}</CardSubtitle>
      <CardBody onClick={handleClick}>
        <div className="row">
          <div className="col">
            Length: {farm.length} / 9
          </div>
          <div className="col">
            <button disabled={farm.length >= 9} className="btn btn-outline-primary" id="btn-upgrade-length">Upgrade</button>
          </div>
        </div>
        <div className="row">
          <div className="col">
            Width: {farm.width} / 9
          </div>
          <div className="col">
            <button disabled={farm.width >= 9} className="btn btn-outline-primary" id="btn-upgrade-width">Upgrade</button>
          </div>
        </div>
        <div className="row">
          <div className="col">
            Irrigation Level: {farm.irrigationLVL} / 5
          </div>
          <div className="col">
            <button disabled={farm.irrigationLVL >= 5} className="btn btn-outline-primary" id="btn-upgrade-irrigation">Upgrade</button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}