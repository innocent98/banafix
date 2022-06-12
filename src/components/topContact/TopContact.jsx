import "./topContact.scss";
import { Email, PhoneIphone } from "@material-ui/icons";

export default function TopContact() {
  return (
    <div className="top">
      <div className="left">
        <div className="cont">
          <Email className="icon" />
          <p><a href="mailto:banafixmusic@gmail.com">banafixmusic@gmail.com</a></p>
        </div>
        <div className="cont">
          <PhoneIphone className="icon" />
          <p><a href="tel:+2347032142784">+2347032142784</a></p>
        </div>
      </div>
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
