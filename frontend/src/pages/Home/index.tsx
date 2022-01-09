import GlobalContext from "../../GlobalContext"
import { useContext, useEffect, useRef, useState } from "react";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import StatTracker from "../../components/StatTracker";
import { Link } from "react-router-dom";
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
  <main className="pt-3 pb-2 text-center">
    <h1 className="Home-welcome">{ currentUser ? `Welcome, ${currentUser.username}!` : "Welcome!" }</h1>
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
        <Link to="/login" className="col-sm-3 offset-sm-2 mt-2 btn btn-lg btn-primary mr-2">Login</Link>
        <Link to="/signup" className="col-sm-3 offset-sm-2 mt-2 btn btn-lg btn-primary ml-2">Signup</Link>
      </div>
    }
  </main>)
}