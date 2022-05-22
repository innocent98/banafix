import "./adminLogin.scss";
import { useContext, useRef, useState } from "react";
import axios from "axios";
import { Context } from "../../context/Context";

const AdminLogin = () => {
  const usernameRef = useRef();
  const passwordRef = useRef();
  const { dispatch, isFetching } = useContext(Context);
  const [error, setError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(false);
    dispatch({ type: "LOGIN_START" });
    try {
      const res = await axios.post("/user/login", {
        username: usernameRef.current.value,
        password: passwordRef.current.value,
      });
      dispatch({ type: "LOGIN_SUCCESS", payload: res.data });
    } catch (err) {
      if (err.response.status === 400) {
        error && alert("Invalid login credentials, please try again");
        setError(true);
        dispatch({ type: "LOGIN_FAILURE", payload: err });
      } else if (err.response.status === 403) {
        error && alert("Account not found!");
        setError(true);
        dispatch({ type: "LOGIN_FAILURE", payload: err });
      } else {
        error && alert("Connection Error! Please check your connection and try again");
        setError(true);
        dispatch({ type: "LOGIN_FAILURE", payload: err });
      }
    }
  };

  return (
    <div className="login">
      <div className="application">
        <form className="row g-3" onSubmit={handleLogin}>
          <div className="col-md-6">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              required
              className="form-control shadow-none"
              ref={usernameRef}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              required
              className="form-control shadow-none"
              ref={passwordRef}
            />
          </div>
          <button
            className={"btn btn-success shadow-none"}
            type="submit"
            disabled={isFetching}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
