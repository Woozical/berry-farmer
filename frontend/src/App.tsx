import './App.css';
import { BrowserRouter } from "react-router-dom";
import PageRoutes from "./Routes";
import LoadingSpinner from './components/LoadingSpinner';
import { useState, useEffect } from "react";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect( () => {
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <div className="App">
      <div className="App-background bg-light"></div>
      <BrowserRouter>
        {loading ? <LoadingSpinner withText /> : <PageRoutes />}
      </BrowserRouter>
    </div>
  );
}

export default App;
