import { useContext, useState } from "react";
import { useAuthenticated } from "../../hooks";
import GlobalContext from "../../GlobalContext";
import { Nav, NavItem, NavLink } from "reactstrap";
import SignupForm from "../../components/SignupForm";
import LoginForm from "../../components/LoginForm";
import "./style.css";

export default function SignupLoginPage(){
  const [showLogin, setShowLogin] = useState(true);
  const { login, signup } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/");
  if (auth) return redirect;

  return (
  <main className="pt-5 pb-5 text-start">
    <div className="container col-md-6 offset-md-3 col-lg-4 offset-lg-4">
      <h1 className="mb-3 text-center">{showLogin ? 'Login' : 'Sign Up'}</h1>
      <Nav tabs>
        <NavItem className="Signup-Login-tab">
          <NavLink
            className={showLogin ? "active" : ""}
            onClick={ () => { setShowLogin(true) }}
          >
            Login
          </NavLink>
        </NavItem>
        <NavItem className="Signup-Login-tab">
          <NavLink
            className={showLogin ? "" : "active"}
            onClick={ () => { setShowLogin(false) }}  
          >
            Signup
          </NavLink>
        </NavItem>
      </Nav>
      <div className="mb-1"></div>
      { showLogin ? <LoginForm submitCallback={login} /> : <SignupForm submitCallback={signup} />}
    </div>
  </main>)
}