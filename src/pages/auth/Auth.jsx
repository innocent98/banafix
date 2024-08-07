import "./auth.scss";
import { NotificationsOutlined } from "@material-ui/icons";
import { useContext, useEffect, useState } from "react";
import Logout from "../../components/logout/Logout";
import { Link } from "react-router-dom";
// import axios from "axios";
import { decode } from "jsonwebtoken";
import { Context } from "../../context/Context";
import { axiosInstance } from "../../config";

const Auth = () => {
  const [displayPassword, setDisplayPassword] = useState(false);

  const { user, dispatch } = useContext(Context);
  const accessToken = useContext(Context);

  const [currentAuth, setCurrentAuth] = useState("");
  const [password, setPassword] = useState("");
  const [auth, setAuth] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "UPDATE_START" });
    try {
      const res = await axiosInstance.put(`/user/edit/auth/${user.user._id}`, {
        accessToken: accessToken.accessToken,
        currentAuth,
        password,
        auth,
      });
      dispatch({ type: "UPDATE_SUCCESS", payload: res.data });
      setSuccess(!success);
      alert("Auth updated successfully. Please keep safe");
      window.location.replace("/dashboard");
    } catch (error) {
      console.log(error.response.status);
      dispatch({ type: "UPDATE_FAILURE" });
      if (error.response.status === 400) {
        alert("Invalid Auth");
      } else if (error.response.status === 406) {
        alert("Password doesn't match");
      } else if (error.response.status === 403) {
        alert("You cannot perform this action!");
      } else {
        alert("Connection Error!");
      }
    }
  };

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
    <div className="settings">
      <div className="left">
        <img src="/assets/img/banafix.jpg" alt="" />
        <div className="component">
          <ul>
            <Link to={`/settings/${user.user._id}`}>
              <li>Update Password</li>
            </Link>
            <li>
              <Logout />
            </li>
          </ul>
        </div>
      </div>
      <div className="right">
        <div className="top">
          <div className="admin">
            <div className="txt">
              <a href="/dashboard">Admin</a>
            </div>

            <a href="/dashboard">
              <img src="/assets/img/banafix.jpg" alt="" />
            </a>
          </div>
          <div className="notification">
            <NotificationsOutlined />
          </div>
        </div>

        <div className="form-container">
          <form className="row g-3" onSubmit={handleSubmit}>
            <div className="col-md-4">
              <input
                type="password"
                placeholder="Current Auth"
                className="form-control shadow-none"
                required
                onChange={(e) => setCurrentAuth(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type="password"
                placeholder="Password"
                className="form-control shadow-none"
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                type={displayPassword ? "text" : "password"}
                placeholder="New Auth"
                className="form-control shadow-none"
                required
                onChange={(e) => setAuth(e.target.value)}
              />
              <i
                onClick={() => setDisplayPassword(!displayPassword)}
                class={
                  displayPassword ? "bi bi-eye-fill" : "bi bi-eye-slash-fill"
                }
              ></i>
            </div>
            <div className="col-md-4">
              <button className="btn btn-primary shadow-none" type="submit">
                Update
              </button>
            </div>
            <div className="col-md-4">
              <Link to={`/settings/${user.user._id}`}>Update Password</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
