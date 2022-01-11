import "./style.css";

export default function Footer(){
  return (
    <footer className="mt-auto d-flex bg-dark flex-wrap justify-content-around px-4 align-items-center py-3 border-top">
      <small className="text-muted col-md-4">
      Weather services provided by <a target="_blank" rel="noopener noreferrer" className="text-muted Footer-link" href="https://www.weatherapi.com/">WeatherAPI</a>
      </small>
      <small className="col-md-4 text-muted text-center fs-7">
        Pokémon and Pokémon character names are trademarks of <a target="_blank" rel="noopener noreferrer" className="text-muted Footer-link" href="https://www.nintendo.com/">Nintendo</a>. <br/>
        This website is provided to all users free-of-charge.
      </small>

      <ul className="nav col-md-4 justify-content-end list-unstyled d-flex">
        <li className="ms-3">
          <a target="_blank" rel="noopener noreferrer" className="text-muted Footer-link" href="https://github.com/Woozical/berry-farmer">
            <i className="bi bi-github"></i>
          </a>
        </li>
        <li className="ms-3">
          <a target="_blank" rel="noopener noreferrer" className="text-muted Footer-link" href="https://www.linkedin.com/in/mark-tilley/">
            <i className="bi bi-linkedin"></i>
          </a>
        </li>
        <li className="ms-3">
          <a target="_blank" rel="noopener noreferrer" className="text-muted Footer-link" href="https://mark-tilley.surge.sh/">
            <i className="bi bi-globe"></i>
          </a>
        </li>
      </ul>
  </footer>
  );
}