import { decode } from "jsonwebtoken";
import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import Logout from "../../components/logout/Logout";
import { Context } from "../../context/Context";
import "./dashboard.scss";

export default function Dashboard() {
  const accessToken = useContext(Context);
  const { dispatch, user } = useContext(Context);
  console.log(user.other)

  //logout a user automatically when session expired
  const handleLogout = async () => {
    dispatch({ type: "LOGOUT" });
  };

  useEffect(() => {
    const token = accessToken.accessToken;
    if (token) {
      const decodedToken = decode(token);
      if (decodedToken.exp * 1000 < new Date().getTime()) {
        handleLogout();
        return alert("Session expired! kindly login again to continue");
      }
    }
  });

  return (
    <div className="dashboard">
      <div className="dashboardItems">
        <ul>
        <a href="/data">
            <li>View Students</li>
          </a>
          <a href="/post-event">
            <li>Post an event</li>
          </a>
          <a href="/post-testimonial">
            <li>Post testimonial</li>
          </a>
          <a href="/post-presentation">
            <li>Upload student presentation</li>
          </a>
          <a href="/post-gallery">
            <li>Update Gallery</li>
          </a>
          <Link to={`/settings/${user.user._id}`} className="link">
              <li>Settings</li>
            </Link>
          <li><Logout/></li>
        </ul>
      </div>
    </div>
  );
}
