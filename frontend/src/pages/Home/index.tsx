import GlobalContext from "../../GlobalContext"
import { useContext } from "react";

export default function HomePage(){
  //@ts-ignore
  const { currentUser } = useContext(GlobalContext);
  return (
  <main>
    Home Page
    { currentUser && currentUser.username }
  </main>)
}