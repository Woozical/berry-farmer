import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import FarmPage from "./pages/Farm";
import SignupLoginPage from "./pages/Signup-Login";
import NotFound404 from "./components/NotFound404";
import FarmListPage from "./pages/FarmList";
import BuySellPage from "./pages/Buy-Sell";

export default function PageRoutes () {
  return (
    <Routes>
      <Route path="/market" element={ <BuySellPage />} />
      <Route path="/farm/:farmID" element={ <FarmPage />} />
      <Route path="/farm" element= { <FarmListPage /> } />
      <Route path="/signup" element={ <SignupLoginPage showSignup />} />
      <Route path="/login" element ={ <SignupLoginPage />} />
      <Route path="/" element = { <HomePage />} />
      <Route path="*" element = { <NotFound404 />} />
    </Routes>
  )
}