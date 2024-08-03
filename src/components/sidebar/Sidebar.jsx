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
          <a href="/about" onClick={() => setMenuOpen(!menuOpen)}>
            About us
          </a>
        </li>
        <li>
          <a href="#services" onClick={() => setMenuOpen(!menuOpen)}>
            Services
          </a>
        </li>
        <li>
          <a href="#faq" onClick={() => setMenuOpen(!menuOpen)}>
            Faqs
          </a>
        </li>
        <li>
          <a href="/gallery" onClick={() => setMenuOpen(!menuOpen)}>
            Gallery
          </a>
        </li>
        <li>
          <a href="/contact" onClick={() => setMenuOpen(!menuOpen)}>
            Contact
          </a>
        </li>
        <li className="join">
          <a href="/">Join Live Event</a>
        </li>
      </ul>
      <hr />
      <div className="right">
        <a href="https://www.facebook.com/profile.php?id=100063690799953">
          <img src="assets/img/fb.png" alt="" />
        </a>
        <a href="https://www.instagram.com/invites/contact/?i=4zu1xzpni9mi&utm_content=4ci7vor">
          <img src="assets/img/ig.png" alt="" />
        </a>
        <a href="/">
          <img src="assets/img/tw.png" alt="" />
        </a>
      </div>
    </div>
  );
}
