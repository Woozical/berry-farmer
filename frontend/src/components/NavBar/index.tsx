import { NavLink, Link } from "react-router-dom";
import  { useState, useContext } from "react";
import { Nav, Collapse, Navbar, NavbarToggler, NavItem } from "reactstrap";
import GlobalContext from "../../GlobalContext";
import "./style.css";

export default function NavBar(){
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useContext(GlobalContext);
  const toggleOpen = () => {
    setIsOpen(n => !n);
  };
  
  return (
    <Navbar color="dark" expand="sm" dark>
      <NavLink to="/" className="navbar-brand">BerryFarmer</NavLink>
      <NavbarToggler onClick={toggleOpen} />
      <Collapse className="justify-content-end" navbar isOpen={isOpen}>
        <Nav navbar>
          { currentUser ?
            <>
              <NavItem>
                <NavLink to="/farm">My Farms ({currentUser.farmCount})</NavLink>
              </NavItem>
              <NavItem>
                <NavLink to="/market">Buy/Sell</NavLink>
              </NavItem>
              <NavItem>
                <small>Funds: ${currentUser.funds.toFixed(2)}</small>
              </NavItem>
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