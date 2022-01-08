import HealthSprite from "../HealthSprite";
import MoistureSprite from "../MoistureSprite";
import type { CropObject } from "../../BerryFarmerAPI";
import { titleCase } from "../../utils";
import { Card, CardTitle, CardBody, CardSubtitle } from "reactstrap";
import type { EventHandler } from "react";
import { timeAgo } from "../../utils";

interface CropDetailsPaneProps {
  crop: CropObject, waterCallback: Function, harvestCallback: Function
}

export default function CropDetailPane(props:CropDetailsPaneProps){
  const berryTitle = titleCase(props.crop.berryType);
  const iconPath = `/assets/berries/${berryTitle}/${berryTitle}-icon.png`;

  const waterCrop:EventHandler<any> = (evt) => {
    if (props.crop.curGrowthStage < 4 && evt.target.id.includes("btn-water")){
      const waterAmt = +evt.target.id.split('-')[2];
      props.waterCallback(waterAmt);
    }
  };

  const harvest:EventHandler<any> = () => {
    if (props.crop.curGrowthStage === 4){
      props.harvestCallback();
    }
  }

  return (
    <Card className="container">
      <CardTitle tag="div" className="row align-items-center">
        <h6 className="col-sm-9">
          {berryTitle} Berry
        </h6>
        <img className="col-sm-3 float-right" src={iconPath} alt={berryTitle} />
      
        <hr />
      </CardTitle>
      <CardSubtitle>
      <div className="row text-center">
          <div className="col">
            Planted: {timeAgo(new Date(props.crop.plantedAt))}.
          </div>
          <div className="col">
            Stage: {props.crop.curGrowthStage} / 4
          </div>
        </div>
      </CardSubtitle>
      <CardBody>
        <div className="row text-center">
          <div className="col-6">
            <div className="row align-items-center">
              <div className="col-2">
                <HealthSprite health={props.crop.health} />
              </div>
              <div className="col-10">
                Health: {props.crop.health.toFixed(0)}%
              </div>
            </div>
          </div>
          <div className="col-6">
            <div className="row align-items-center">
              <div className="col-2">
                <MoistureSprite moisture={props.crop.moisture} />
              </div>
              <div className="col-10">
                Moisture: {props.crop.moisture.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>
        <hr />
        <div onClick={waterCrop} className="row text-center">
          <h6 className={props.crop.curGrowthStage === 4 ? "text-secondary" : ""}>Water:</h6>
          <div>
            <button id="btn-water-20" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +20
            </button>
            <button id="btn-water-40" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +40
            </button>
            <button id="btn-water-60" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +60
            </button>
            <button id="btn-water-80" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +80
            </button>
            <button id="btn-water-100" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +100
            </button>
          </div>
        </div>
        <hr />
        <div className="row">
          <button
            className="btn btn-success btn-lg"
            disabled={props.crop.curGrowthStage < 4}
            onClick={harvest}>Harvest</button>
        </div>
      </CardBody>
    </Card>

  )
}