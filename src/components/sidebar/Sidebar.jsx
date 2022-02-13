import "./sidebar.scss";

export default function Sidebar({ menuOpen, setMenuOpen }) {
  return (
    <div className={"side " + (menuOpen && "active")}>
      <ul>
        <li>
          <a href="#intro" onClick={() => setMenuOpen(!menuOpen)}>
            Home
          </a>
        </li>
        <li>
          <a href="#about" onClick={() => setMenuOpen(!menuOpen)}>
            About us
          </a>
        </li>
        <li>
          <a href="#servies" onClick={() => setMenuOpen(!menuOpen)}>
            Services
          </a>
        </li>
        <li>
          <a href="#contact" onClick={() => setMenuOpen(!menuOpen)}>
            Contact
          </a>
        </li>
        <li className="join">
          <a href="/">Join Live Event</a>
        </li>
      </ul>
      <hr />
      <div className="right">
        <a href="/">
          <img src="assets/img/fb.png" alt="" />
        </a>
        <a href="/">
          <img src="assets/img/ig.png" alt="" />
        </a>
        <a href="/">
          <img src="assets/img/tw.png" alt="" />
        </a>
      </div>
    </div>
  );
}
