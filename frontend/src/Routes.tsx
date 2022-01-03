import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home";
import FarmPage from "./pages/Farm";
import SignupLoginPage from "./pages/Signup-Login";
import CreateFarmPage from "./pages/CreateFarm";
import NotFound404 from "./components/NotFound404";

export default function PageRoutes () {
  return (
    <Routes>
      <Route path="/farm/create" element={ <CreateFarmPage />} />
      <Route path="/farm/*" element={ <FarmPage />} />
      <Route path="/signup" element={ <SignupLoginPage />} />
      <Route path="/login" element ={ <SignupLoginPage />} />
      <Route path="/" element = { <HomePage />} />
      <Route path="*" element = { <NotFound404 />} />
    </Routes>
  )
}