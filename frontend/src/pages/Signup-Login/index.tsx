import { useContext, useState } from "react";
import { useAuthenticated } from "../../hooks";
import GlobalContext from "../../GlobalContext";
import { Nav, NavItem, NavLink } from "reactstrap";
import SignupForm from "../../components/SignupForm";
import LoginForm from "../../components/LoginForm";
import "./style.css";

interface SignupLoginPageProps {
  showSignup?: boolean
}

export default function SignupLoginPage(props:SignupLoginPageProps){
  const [showSignup, setShowSignup] = useState(props.showSignup || false);
  const { login, signup } = useContext(GlobalContext);
  const [auth, redirect] = useAuthenticated("/");
  if (auth) return redirect;

  return (
  <main className="pt-5 pb-5 text-start">
    <div className="container col-md-6 offset-md-3 col-lg-4 offset-lg-4">
      <h1 className="mb-3 text-center">{showSignup ? 'Sign Up' : 'Login'}</h1>
      <Nav tabs>
        <NavItem className="Signup-Login-tab">
          <NavLink
            className={showSignup ? "" : "active"}
            onClick={ () => { setShowSignup(false) }}
          >
            Login
          </NavLink>
        </NavItem>
        <NavItem className="Signup-Login-tab">
          <NavLink
            className={showSignup ? "active" : ""}
            onClick={ () => { setShowSignup(true) }}  
          >
            Signup
          </NavLink>
        </NavItem>
      </Nav>
      <div className="mb-1"></div>
      { showSignup ? <SignupForm submitCallback={signup} /> : <LoginForm submitCallback={login} /> }
    </div>
  </main>)
}