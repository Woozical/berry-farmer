import GlobalContext from "../../GlobalContext";
import { useState, useContext, useRef, useEffect, ChangeEvent } from "react";
import { Alert, Nav, NavItem, TabContent, TabPane, NavLink, Table } from "reactstrap";
import { useAuthenticated, useAlert } from "../../hooks";
import { Navigate } from "react-router-dom";
import Forbidden403 from "../../components/Forbidden403";
import NotFound404 from "../../components/NotFound404";
import GenericError from "../../components/GenericError";
import BerryFarmerAPI from "../../BerryFarmerAPI";
import BerryListing from "../../components/BerryListing";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function BuySellPage(){
  const { currentUser, modInventory, updateNumericField } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/login");
  const [loading, setLoading] = useState(true);
  const [showBuy, setShowBuy] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const apiError = useRef<null|string|number>(null);
  const [alert, notify] = useAlert();
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
    if (auth) loadPrices().finally(() => {
      setLoading(false);
    });
  }, [auth]);

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
    try {
      if (!currentUser || amount < 1 || (!showBuy && currentUser.inventory[berryType] < amount)) return;
      const method = showBuy ? "buy" : "sell";
      const result = await BerryFarmerAPI.berryTransaction(method, berryType, amount);
      notify(result.message, "success");
      if (showBuy){
        updateNumericField("funds", result.buyOrderPrice * -1);
        modInventory(berryType, amount);
      } else {
        updateNumericField("funds", result.sellOrderPrice);
        modInventory(berryType, amount * -1);
      }
    } catch (err:any) {
      console.error(err);
      notify(err.message ? err.message : "Error", "danger");
    }
  };

  const handleChange = (evt:ChangeEvent<HTMLInputElement>) => {
    const { name, value } = evt.target;
    if (name === "searchTerm") setSearchTerm(value);
  };

  return (
    <main className="pt-3 pb-2 mb-5">
      { loading ?
        <LoadingSpinner withText withPadding />
      :
        <div className="container">
          <h1>Market</h1>
          <Nav className="mt-4" justified tabs>
            <NavItem>
              <NavLink onClick={() => { setShowBuy(true); }} active={showBuy}>
                <h5>Buy</h5>
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink onClick={() => { setShowBuy(false); }} active={!showBuy}>
                <h5>Sell</h5>
              </NavLink>
            </NavItem>
          </Nav>
          <TabContent activeTab={1}>
            <TabPane className="bg-white border-start border-end border-bottom container pt-3" tabId={1}>
              <div className="row">
                <div className="col-sm-2">
                  <label htmlFor="market-search" className="form-label">Filter by Name:</label>
                </div>
                <div className="col-sm-6">
                  <input
                    className="form-control w-sm-50"
                    type="text" name="searchTerm"
                    id="market-search"
                    onChange={handleChange}
                    value={searchTerm}
                  />
                </div>
                <div className="col-sm-4">
                  {alert.msg && <Alert color={alert.color} toggle={() => { notify(""); }}>{alert.msg}</Alert>}
                </div>
              </div>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Price</th>
                    <th>Amount</th>
                    <th>{showBuy ? "Buy" : "Sell"}</th>
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
                          orderCallback={berryOrder} />
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
                          orderCallback={berryOrder} />
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