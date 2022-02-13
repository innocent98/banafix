import "./topContact.scss";
import { Email, PhoneIphone } from "@material-ui/icons";

export default function TopContact() {
  return (
    <div className="top">
      <div className="left">
        <div className="cont">
          <Email className="icon" />
          <p>banafix@mail.com</p>
        </div>
        <div className="cont">
          <PhoneIphone className="icon" />
          <p>+2347032142784</p>
        </div>
      </div>
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
