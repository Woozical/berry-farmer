import { useState, ChangeEvent, useContext } from "react";
import { Button } from "reactstrap";
import BerryIcon from "../BerryIcon";
import { titleCase } from "../../utils";
import GlobalContext from "../../GlobalContext";
import "./style.css";


interface BerryListingProps {
  buyMode?: boolean, price: number, berryType: string, orderCallback: Function
}

export default function BerryListing (props:BerryListingProps) {
  const BUY_MARKUP = 1.15;
  const { currentUser } = useContext(GlobalContext);
  const [orderAmount, setOrderAmount] = useState<number>(0);
  const title = titleCase(props.berryType);

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { value } = evt.target;
    const num = Number(value);
    // eslint-disable-next-line
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
    <tr>
      <td>
        <BerryIcon berryType={props.berryType} placement="left" />
        {title}
      </td>
      <td>
        ${props.buyMode ?
          (props.price * BUY_MARKUP * Math.max(1, orderAmount)).toFixed(2)
          :
          (props.price * Math.max(1, orderAmount)).toFixed(2)}
      </td>
      <td className="">
        <div className="row justify-content-center align-items-center">
          <i
            onClick={ () => {adjustAmount(-1)}}
            className="d-none d-md-inline col-1 bi bi-dash-circle me-1 BerryListing-button" />
          <input
            className="col-sm-4 col-md-2 col-7 text-center"
            onChange={handleChange}
            name={`${props.berryType}OrderAmount`}
            type="text"
            value={orderAmount} />
          <i
            onClick={ () => {adjustAmount(1)}}
            className="d-none d-md-inline col-1 bi bi-plus-circle ms-1 BerryListing-button" />
        </div>
      </td>
      <td>
        <Button onClick={order} color="primary">Order</Button>
      </td>
    </tr>
  );
}