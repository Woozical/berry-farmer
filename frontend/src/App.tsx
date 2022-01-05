import './App.css';
import { BrowserRouter } from "react-router-dom";
import PageRoutes from "./Routes";
import LoadingSpinner from './components/LoadingSpinner';
import { useState, useEffect } from "react";
import BerryFarmerAPI from './BerryFarmerAPI';
import GlobalContext from './GlobalContext';
import type { LoginPayload, RegisterPayload } from "./BerryFarmerAPI";

function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
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
  }

  /** Global functions that edit the currentUser */
  const signup = async ({username, password, email}:RegisterPayload) => {
    try {
      const token = await BerryFarmerAPI.registerUser({username, password, email});
      BerryFarmerAPI.token = token;
      const user = await changeUserLogin(username);
      return [true, user];
    } catch (err:any) {
      console.error(err);
      return [false, err.message];
    }
  }

  const login = async ({username, password}:LoginPayload) => {
    try {
      const token = await BerryFarmerAPI.getToken({username, password});
      BerryFarmerAPI.token = token;
      const user = await changeUserLogin(username);
      return [true, user];
    } catch (err:any) {
      console.error(err);
      return [false, err.message];
    }
  }

  /** Wipes localStorage login info, API token, and currentUser */
  const logout = () => {
    localStorage.setItem("berryFarmer-token", "");
    localStorage.setItem("berryFarmer-username", "");
    BerryFarmerAPI.token = "";
    setCurrentUser(null);
  }

  return (
    <GlobalContext.Provider value= { { currentUser, login, logout, signup } }>
      <div className="App">
        <div className="App-background bg-light"></div>
        <BrowserRouter>
          {loading ? <LoadingSpinner withText /> : <PageRoutes />}
        </BrowserRouter>
      </div>
    </GlobalContext.Provider>
  );
}

export default App;
