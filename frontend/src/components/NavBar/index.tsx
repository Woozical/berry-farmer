import { NavLink, Link } from "react-router-dom";
import  { useState, useContext } from "react";
import { addCommas } from "../../utils";
import { Nav, Collapse, Navbar, NavbarToggler, NavItem, NavbarText } from "reactstrap";
import GlobalContext from "../../GlobalContext";
import spade from "../../media/spade-b.png";
import "./style.css";

export default function NavBar(){
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useContext(GlobalContext);
  const toggleOpen = () => {
    setIsOpen(n => !n);
  };
  
  return (
    <Navbar color="dark" expand="sm" dark>
      <NavLink to="/" className="navbar-brand">
        <img src={spade} alt="" />
        BerryFarmer
      </NavLink>
      <NavbarToggler onClick={toggleOpen} />
      <Collapse className="justify-content-end" navbar isOpen={isOpen}>
        <Nav className="align-items-center" navbar>
          { currentUser ?
            <>
              <NavItem>
                <NavLink to="/farm">My Farms ({currentUser.farmCount})</NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/market">Buy/Sell</NavLink>
              </NavItem>
              <NavbarText className="text-white">
                Funds: ${
                  currentUser.funds < 1000 ?
                    currentUser.funds.toFixed(2)
                    :
                    addCommas(Number(currentUser.funds.toFixed(0)))}
              </NavbarText>
              <NavItem>
                <Link to="/" onClick={logout}>Logout</Link>
              </NavItem>
            </>
            :
            <>
              <NavItem>
                <NavLink to="/login">Login</NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/signup">Signup</NavLink>
              </NavItem>
            </>}
        </Nav>
      </Collapse>
    </Navbar>
  )
}