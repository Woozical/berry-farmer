import { useState, useEffect, ChangeEvent, useContext } from "react";
import { Card, CardBody, Button, Popover, PopoverBody, PopoverHeader, CardHeader } from "reactstrap";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import LoadingSpinner from "../LoadingSpinner";
import { titleCase } from "../../utils";
import GlobalContext from "../../GlobalContext";
import type { BerryProfileObject } from "../../BerryFarmerAPI";
import "./style.css";


interface BerryListingProps {
  buyMode?: boolean, price: number, berryType: string, orderCallback: Function
}

export default function BerryListing (props:BerryListingProps) {
  const BUY_MARKUP = 1.15;
  const [showDetailed, setShowDetailed] = useState<boolean>(false);
  const { currentUser } = useContext(GlobalContext);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const [profile, setProfile] = useState<null|BerryProfileObject>(null);
  const title = titleCase(props.berryType);

  useEffect( () => {
    async function loadProfile(){
      const profile = await BerryFarmerAPI.getBerryProfile(props.berryType);
      setProfile(profile);
    }
    if (showDetailed) loadProfile();
  }, [showDetailed, props.berryType]);

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { value } = evt.target;
    const num = Number(value);
    if (!currentUser || num !== num) return; // null user, NaN
    if (!props.buyMode && num > currentUser.inventory[props.berryType]){
      // if in sell mode, force num to be current inventory of berry if user changes it to go over
      setOrderAmount(currentUser.inventory[props.berryType]);
    }
    else {
      setOrderAmount(Math.max(0, Math.min(99, num)));
    }
  };

  const adjustAmount = (num:number) => {
    if (!currentUser) return;
    const newAmt = num + orderAmount;
    if (!props.buyMode && newAmt > currentUser.inventory[props.berryType]) return;
    setOrderAmount(Math.max(0, Math.min(99, newAmt)));
  };

  const order = async () => {
    await props.orderCallback(props.berryType, orderAmount);
    setOrderAmount(0);
  };

  return (
    <>
    <tr>
      <th id={`market-row-${props.berryType}`}>
        <Button onClick={ () => {setShowDetailed(b => !b)}}>{showDetailed ? "-" : "+"}</Button>
      </th>
      <td>
        <img src={`/assets/berries/${title}/${title}-icon.png`} alt={title} />
        {title}
      </td>
      <td>
        ${props.buyMode ?
          (props.price * BUY_MARKUP * Math.max(1, orderAmount)).toFixed(2)
          :
          (props.price * Math.max(1, orderAmount)).toFixed(2)}
      </td>
      <td>
        <i onClick={ () => {adjustAmount(-1)}} className="bi bi-dash-circle me-1 BerryListing-button" />
        <input onChange={handleChange} name={`${props.berryType}OrderAmount`} size={2} type="text" value={orderAmount} />
        <i onClick={ () => {adjustAmount(1)}} className="bi bi-plus-circle ms-1 BerryListing-button" />
      </td>
      <td>
        <Button onClick={order} color="primary">Order</Button>
      </td>
    </tr>
    <Popover target={`market-row-${props.berryType}`} isOpen={showDetailed}>
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
}