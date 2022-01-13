import BerryFarmerAPI from "../../BerryFarmerAPI";
import { Card, CardBody, Popover, PopoverBody, PopoverHeader, CardHeader } from "reactstrap";
import LoadingSpinner from "../LoadingSpinner";
import { titleCase } from "../../utils";
import type { BerryProfileObject } from "../../BerryFarmerAPI";
import { useState, useEffect, useRef } from "react";
import "./style.css";

interface BerryIconProps {
  berryType: string, className?: string, placement?: "top" | "bottom" | "left" | "right"
}

export default function BerryIcon(props:BerryIconProps){
  const [showDetails, setShowDetails] = useState(false);
  const [profile, setProfile] = useState<null|BerryProfileObject>(null);
  const title = titleCase(props.berryType);
  const imgElement: React.RefObject<HTMLImageElement> = useRef(null);

  useEffect( () => {
    async function loadProfile(){
      const profile = await BerryFarmerAPI.getBerryProfile(props.berryType);
      setProfile(profile);
    }
    if (showDetails && (!profile || profile.name !== props.berryType)) loadProfile();
  }, [showDetails, profile, props.berryType]);

  return (
    <>
    <img
      ref={imgElement}
      className={`berryIcon ${props.className}`}
      onClick={() => { setShowDetails(s => !s); }}
      src={`/assets/berries/${title}/${title}-icon.png`}
      alt={title}
    />
    <Popover flip placement={props.placement} toggle={() => { setShowDetails(false); }} target={imgElement} isOpen={showDetails}>
      { !profile ?
        <PopoverBody><LoadingSpinner /></PopoverBody>
      :
        <>
          <PopoverHeader>{title} Berry</PopoverHeader>
          <PopoverBody>
            <Card>
              <CardHeader className="text-center">
              <img src={`/assets/types/${profile.pokeType}.png`} alt={profile.pokeType} />
              </CardHeader>
              <CardBody>
                <small>
                <b>Growth Rate:</b> {profile.growthTime} hours <br/>
                <b>Dehydration Rate:</b> {profile.dryRate}% / hour <br/>
                <b>Ideal Temperature:</b> {profile.idealTemp}°C <br/>
                <b>Ideal Cloud Coverage:</b> {profile.idealCloud}% <br/>
                <b>Max Harvest:</b> {profile.maxHarvest} berries <br/>
                <b>Size:</b> {profile.size}cm <br/>
                </small>
              </CardBody>
            </Card>

          </PopoverBody>      
        </>
      }
    </Popover>
  </>
  );
};

BerryIcon.defaultProps = {
  placement: "bottom", className: ""
};