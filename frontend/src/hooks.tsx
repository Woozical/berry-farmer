import { useContext, useState } from "react";
import GlobalContext from "./GlobalContext";
import { Navigate } from "react-router-dom";

// Checks to see if currentUser is defined in the GlobalConteext, if not, redirects to the given path
// Example call:
// const [auth, redirect] = useAuthenticated("/login");
// if (!auth) return redirect;
export function useAuthenticated(redirectPath:string): [ boolean, JSX.Element ] {
  const { currentUser } = useContext(GlobalContext);
  const nav = <Navigate to={redirectPath} />;
  return currentUser ? [true, nav] : [false, nav];
}

interface AlertState {
  msg: string, color: string
}

export function useAlert(initialMsg="", defaultColor="primary"): [AlertState, (msg: string, color?: string) => void]{
  const [alertState, setAlertState] = useState<AlertState>({ msg: initialMsg, color: defaultColor });
  const notify = (msg: string, color: string = defaultColor) => {
    setAlertState({ msg, color });
  };
  return [alertState, notify];
}