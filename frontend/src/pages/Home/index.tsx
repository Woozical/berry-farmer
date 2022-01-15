import GlobalContext from "../../GlobalContext"
import { useContext, useEffect, useRef, useState } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import StatTracker from "../../components/StatTracker";
import FarmPreviewIMG from "../../media/farm-preview.png";
import { Link } from "react-router-dom";
import { titleCase } from "../../utils";
import "./style.css";

export default function HomePage(){
  const { currentUser } = useContext(GlobalContext);
  const [counts, setCounts] = useState({ farms: 0, users: 0, locations: 0});
  const [showCounts, setShowCounts] = useState(false);
  const apiError = useRef(null);

  useEffect(() => {
    async function loadCounts(){
      try{
        const { farms, users, locations } = await BerryFarmerAPI.getSplash();
        setCounts({ farms, users, locations });
      } catch (err:any) {
        if (err.response){
          apiError.current = err.response.status;
        } else {
          apiError.current = err.message;
        }
      }
      setShowCounts(true);
    }
    loadCounts();
  }, []);

  return (
  <main className="pt-3 pb-2 container text-center">
    <div className="Home-bg"></div>
    <h1 className="Home-welcome">{ currentUser ? `Welcome, ${titleCase(currentUser.username)}!` : "Welcome!" }</h1>
    <br />
    { 
    apiError.current ?
      <p className="text-muted">An error occured when connecting to BerryFarmer API.<br/>App functionality could be impacted.</p>
    :
    showCounts ?
      <StatTracker {...counts} />
    :
      null
    }
    {!currentUser &&
      <div className="row">
        <Link to="/login" className="btn btn-lg btn-primary col-sm-3 offset-sm-2 mt-2 mr-sm-2">Login</Link>
        <Link to="/signup" className="btn btn-lg btn-primary col-sm-3 offset-sm-2 mt-2 ml-sm-2">Signup</Link>
      </div>
    }
    <div className="row justify-content-center mt-4 py-2 align-items-top">
      <div className="bg-white col-lg-5 col-md-6 border-sm-end border-md-end-0 border-sm-start border-top border-sm-bottom-0 border-md-bottom">
        <img width="100%" src={FarmPreviewIMG} alt="BerryFarmer" />
      </div>
      <div className="bg-white col-lg-5 col-md-6 border-md-start-0 border-sm-start border-end border-sm-top-0 border-md-top border-bottom text-start pt-3">
        <p><b>Berry Farmer</b> is a web application that seeks to emulate the process of growing berries in the Pokémon games. The twist?
        Your berry farm is located somewhere in the real world! Each type of berry has a profile of ideal growing conditions, and the 
        real world weather data of your farm's location will aid or hinder the growth of your berries.</p>
        <p>
          After registering for a free account, use your startup funds to purchase your first farm and some berries to plant. Be sure to check
          a berry's profile by clicking on its icon to ensure that it will stay healthy when exposed to the weather patterns of your farm. Check up
          on your berries every now and again to make sure they're adequately watered.
        </p>
        <p className="fs-7">
          If you're in need of financial aid, feel free to reach out to me :]
        </p>
      </div>
    </div>
  </main>)
}