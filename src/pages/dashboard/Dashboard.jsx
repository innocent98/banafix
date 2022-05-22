import Logout from "../../components/logout/Logout";
import "./dashboard.scss";

export default function Dashboard() {
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
          <li><Logout/></li>
        </ul>
      </div>
    </div>
  );
}
