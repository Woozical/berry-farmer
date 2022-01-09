import GlobalContext from "../../GlobalContext";
import { useState, useContext, useRef, useReducer, useEffect, ChangeEvent } from "react";
import { Nav, NavItem, TabContent, TabPane, NavLink, Table } from "reactstrap";
import { useAuthenticated } from "../../hooks";
import { Navigate } from "react-router-dom";
import Forbidden403 from "../../components/Forbidden403";
import NotFound404 from "../../components/NotFound404";
import GenericError from "../../components/GenericError";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import { titleCase } from "../../utils";
import BerryListing from "../../components/BerryListing";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function BuySellPage(){
  const { currentUser, modInventory, updateNumericField } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/login");
  const [loading, setLoading] = useState(true);
  const [showBuy, setShowBuy] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const apiError = useRef<null|string|number>(null);
  const priceData = useRef<{prices: any, hot: Array<string>, not: Array<string>}>();

  /** Load In Price Data */
  useEffect(() => {
    async function loadPrices(){
      try {
        const data = await BerryFarmerAPI.getBerryPrices();
        priceData.current = data;
      } catch (err:any) {
        if (err.response){
          apiError.current = err.response.status;
        } else {
          apiError.current = err.message;
        }
      }
    }
    loadPrices().finally(() => {
      setLoading(false);
    });
  }, []);

  if(!auth) return redirect;

  // Handle error if api error
  if (apiError.current){
    switch (apiError.current){
      case 401:
        return <Navigate to="/login" />;
      case 403:
        return <Forbidden403 />;
      case 404:
        return <NotFound404 />;
      default:
        return (
          (typeof apiError.current === "string") ? <GenericError errMsg={apiError.current} />
          : <GenericError errCode={apiError.current} />
        );
    }
  }

  const berryOrder = async (berryType:string, amount:number) => {
    if (!currentUser || (!showBuy && currentUser.inventory[berryType] < amount)) return;
    const method = showBuy ? "buy" : "sell";
    await BerryFarmerAPI.berryTransaction(method, berryType, amount);
  };

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    if (name === "searchTerm") setSearchTerm(value);
  };

  console.log(priceData.current);

  return (
    <main>
      { loading ?
        <LoadingSpinner withText withPadding />
      :
        <div className="container">
          <Nav tabs>
            <NavItem>
              <NavLink onClick={() => { setShowBuy(true); }} active={showBuy}>
                Buy
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink onClick={() => { setShowBuy(false); }} active={!showBuy}>
                Sell
              </NavLink>
            </NavItem>
          </Nav>
          <input type="text" name="searchTerm" id="market-search" onChange={handleChange} value={searchTerm} />
          <TabContent activeTab={1}>
            <TabPane tabId={1}>
              <Table>
                <thead>
                  <tr>
                    <th>Details</th> <th>Name</th> <th>Price</th> <th>Amount</th> <th>-</th>
                  </tr>
                  </thead>
                  <tbody>
                  { showBuy ?
                    Object.keys(priceData.current!.prices).filter(key => key.includes(searchTerm)).map(key => {
                      return (
                        <BerryListing
                          key={key}
                          buyMode
                          berryType={key}
                          price={priceData.current!.prices[key]}
                          orderCallback={() => {}} />
                      );})
                    :
                    Object.keys(currentUser!.inventory)
                    .filter(key => {
                      return (key.includes(searchTerm) && currentUser!.inventory[key] > 0)
                    })
                    .map(key => {
                      return (
                        <BerryListing
                          key={key}
                          berryType={key}
                          price={priceData.current!.prices[key]}
                          orderCallback={() => {}} />
                      );})
                  }
                  </tbody>
              </Table>
            </TabPane>
          </TabContent>
        </div>
      }
    </main>
  )
}