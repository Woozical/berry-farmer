import './App.css';
import { BrowserRouter } from "react-router-dom";
import PageRoutes from "./Routes";
import LoadingSpinner from './components/LoadingSpinner';
import { useState, useEffect } from "react";
import BerryFarmerAPI from './BerryFarmerAPI';
import GlobalContext, {ICurrentUser} from './GlobalContext';
import type { LoginPayload, RegisterPayload } from "./BerryFarmerAPI";
import NavBar from './components/NavBar';
import Footer from './components/Footer';

function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<null|ICurrentUser>(null);
  
  /** App Mount, attempt to read user info from local storage */
  useEffect( () => {
    async function loadUser(token:string, username:string){
      BerryFarmerAPI.token = token;
      try {
        const user = await BerryFarmerAPI.getUser(username);
        setCurrentUser(user);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    
    const localToken = localStorage.getItem("berryFarmer-token");
    const localUsername = localStorage.getItem("berryFarmer-username");
    if (localToken && localUsername){
      loadUser(localToken, localUsername);
    } else {
      setLoading(false);
    }
  }, []);

  /** Convenience func to grab user info from api, set it to currentuser, and update localStorage.
   *  Should be called after setting BerryFarmerAPI.token to match credentials of new user.
   */
  const changeUserLogin = async (username:string) => {
    const user = await BerryFarmerAPI.getUser(username);
    localStorage.setItem("berryFarmer-token", BerryFarmerAPI.token);
    localStorage.setItem("berryFarmer-username", username);
    setCurrentUser(user);
    return user;
  };

  /** Global functions that edit the currentUser */
  const signup = async ({username, password, email}:RegisterPayload) => {
    try {
      const token = await BerryFarmerAPI.registerUser({username, password, email});
      BerryFarmerAPI.token = token;
      const user = await changeUserLogin(username);
      return [true, user];
    } catch (err:any) {
      let msg = err.message || "An error occured.";
      if (err.response){
        msg = err.response.data.error.message;
      }
      return [false, msg];
    }
  };

  const login = async ({username, password}:LoginPayload) => {
    try {
      const token = await BerryFarmerAPI.getToken({username, password});
      BerryFarmerAPI.token = token;
      const user = await changeUserLogin(username);
      return [true, user];
    } catch (err:any) {
      let msg = err.message  || "An error occured.";
      if (err.response){
        msg = err.response.data.error.message;
      }
      return [false, msg];
    }
  };

  /** Wipes localStorage login info, API token, and currentUser */
  const logout = () => {
    localStorage.setItem("berryFarmer-token", "");
    localStorage.setItem("berryFarmer-username", "");
    BerryFarmerAPI.token = "";
    setCurrentUser(null);
  };

  /** Updates the currentUser's inventory */
  const modInventory = (berryType:string, amountAdjust:number) => {
    if (currentUser === null) return;
    const oldAmt = currentUser.inventory[berryType] || 0;
    currentUser.inventory[berryType] = oldAmt + amountAdjust;
    setCurrentUser({...currentUser});
  };

  const updateNumericField = (key: "funds" | "farmCount", amountAdjust: number) => {
    if (currentUser === null) return;
    currentUser[key] += amountAdjust;
    setCurrentUser({...currentUser});
  };

  return (
    <GlobalContext.Provider value= { { currentUser, login, logout, signup, modInventory, updateNumericField } }>
      <div className="App  d-flex flex-column min-vh-100">
        <div className="App-background bg-light"></div>
        <BrowserRouter>
          <NavBar />
          {loading ? <LoadingSpinner withText /> : <PageRoutes />}
          <Footer />
        </BrowserRouter>
      </div>
    </GlobalContext.Provider>
  );
}

export default App;
