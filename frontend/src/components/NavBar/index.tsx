import { NavLink, Link } from "react-router-dom";
import  { useState, useContext } from "react";
import { Nav, Navbar, NavbarToggler, NavItem } from "reactstrap";
import { Routes, Route } from "react-router-dom";

export default function NavBar(){
  const [isOpen, setIsOpen] = useState(false);
  const toggleOpen = () => {
    setIsOpen(n => !n);
  };
  return (
    // <Navbar>
    //   <NavLink to="/" className="navbar-brand">BerryFarmer</NavLink>

    //   <NavbarToggler onClick={toggleOpen} />
    //   <Ul
    // </Navbar>
    <Nav vertical>
      <NavItem>
        <NavLink to="/">Home</NavLink>
      </NavItem>
      <NavItem>
        <NavLink to="/login">Login</NavLink>
      </NavItem>
      <NavItem>
        <NavLink to="/signup">Signup</NavLink>
      </NavItem>
      <NavItem>
        <NavLink to="/farm/4">Farm</NavLink>
      </NavItem>
      <Routes>
        <Route path="/farm/:id" element={
          <button>Show stuff</button>
        } />
      </Routes>
    </Nav>
  )
}