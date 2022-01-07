import { NavLink } from "react-router-dom";
import  { useState, useContext } from "react";
import { Nav, Navbar, NavbarToggler, NavItem } from "reactstrap";
import { Routes, Route } from "react-router-dom";

export default function NavBar(){
  // const [isOpen, setIsOpen] = useState(false);
  // const toggleOpen = () => {
  //   setIsOpen(n => !n);
  // };
  return (
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
        <NavLink to="/farm">Farm</NavLink>
      </NavItem>
    </Nav>
  )
}