import "./otherTopbar.scss";

const OtherTopbar = ({ menuOpen, setMenuOpen }) => {
  return (
    <div className={"topbar " + (menuOpen && "active")}>
      <div className="left">
        <a href="/">Banafix</a>
      </div>
      <div className="right">
        <div className="navLink">
          <a href="/" className="link active">
            Home
          </a>
          <a href="/about" className="link">
            About Us
          </a>
          <a href="/" className="link">
            Services
          </a>
          <a href="/" className="link">
            Faqs
          </a>
          <a href="/gallery" className="link">
            Gallery
          </a>
          <a href="/contact" className="link">
            Contact
          </a>
          <a href="/" className="join">
            Join Live Event
          </a>

          <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span className="line1"></span>
            <span className="line2"></span>
            <span className="line3"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtherTopbar;
