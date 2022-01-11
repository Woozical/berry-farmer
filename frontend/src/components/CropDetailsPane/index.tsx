import HealthSprite from "../HealthSprite";
import MoistureSprite from "../MoistureSprite";
import BerryIcon from "../BerryIcon";
import type { CropObject } from "../../BerryFarmerAPI";
import { titleCase } from "../../utils";
import { Card, CardTitle, CardBody, CardSubtitle } from "reactstrap";
import type { EventHandler } from "react";
import { timeAgo } from "../../utils";

interface CropDetailsPaneProps {
  crop: CropObject, waterCallback: Function, harvestCallback: Function, deleteCallback: Function
}

export default function CropDetailsPane(props:CropDetailsPaneProps){
  const berryTitle = titleCase(props.crop.berryType);

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
  };

  const destroy:EventHandler<any> = () => {
    props.deleteCallback();
  }

  return (
    <Card className="container border-0">
      <CardTitle tag="div" className="row align-items-center">
        <h6 className="col-9">
          {berryTitle} Berry
        </h6>
        <BerryIcon berryType={props.crop.berryType} className="col-3 float-right" />
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
            <button id="btn-water-5" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
                +5
              </button>
            <button id="btn-water-20" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +20
            </button>
            <button id="btn-water-40" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +40
            </button>
            <button id="btn-water-60" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +60
            </button>
            <button id="btn-water-100" className="btn btn-outline-primary m-1" disabled={props.crop.curGrowthStage === 4}>
              +100
            </button>
          </div>
        </div>
        <hr />
        <div className="row">
          <button
            className="col-4 btn btn-success btn-lg"
            disabled={props.crop.curGrowthStage < 4}
            onClick={harvest}>
              Harvest
          </button>
          <button
            className="col-4 offset-4 btn btn-danger btn-lg"
            onClick={destroy}
          >
            Destroy
          </button>
        </div>
      </CardBody>
    </Card>
  )
}