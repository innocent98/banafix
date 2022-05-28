import "./studentPage.scss";
import { useContext, useEffect, useState } from "react";
// import { Context } from "../../context/Context";
import { useLocation } from "react-router";
import avatarp from "./assets/download.png";
import Logout from "../../components/logout/Logout";
import { Link } from "react-router-dom";
// import axios from "axios";
import { axiosInstance } from "../../config";
import { Context } from "../../context/Context";
import { decode } from "jsonwebtoken";

const StudentPage = () => {
  const [student, setStudent] = useState([]);
  const { user } = useContext(Context);
  const accessToken = useContext(Context);
  const { dispatch } = useContext(Context);

  const location = useLocation();
  const path = location.pathname.split("/")[2];

  useEffect(() => {
    const fetchSingleEngr = async () => {
      const res = await axiosInstance.get(`/student/students/${path}`);
      setStudent(res.data);
    };
    fetchSingleEngr();
  }, [path]);

  const [isActive, setIsActive] = useState(student.isActive);

  useEffect(() => {
    setIsActive(student.isActive);
  }, [student.isActive]);

  const handleStatusChange = async () => {
    try {
      if (isActive) {
        await axiosInstance.put(`/user/edit/student/${path}`, {
          accessToken: accessToken.accessToken,
          isActive: false,
        });
        alert("Student status updated successfully from active to inactive");
      } else {
        await axiosInstance.put(`/user/edit/student/${path}`, {
          accessToken: accessToken.accessToken,
          isActive: true,
        });
        alert("Student status updated successfully from inactive to active");
      }
    } catch (err) {}
    setIsActive(!isActive);
  };

  const [popup, setPopup] = useState(false);

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/user/students/${path}`, {
        data: { accessToken: accessToken.accessToken },
      });
      alert("Student successfully deleted");
      window.location.replace("/data");
    } catch (err) {
      if (err.response.status === 404) {
        alert("Student not found");
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
    <div className="student">
      <div className="left">
        <img src="/assets/img/banafix.jpg" alt="" />
        <div className="component">
          <ul>
            <Link to={`/settings/${user.other._id}`} className="link">
              <li>Settings</li>
            </Link>
            <li>
              <Logout />
            </li>
          </ul>
        </div>
      </div>

      <div className={"right " + (popup && "disable")}>
        <div className="topb">
          <div className="admin">
            <div className="txt">{user.username}</div>
            <img src="/assets/img/banafix.jpg" alt="" />
          </div>
          <div className="notification status">
            Change Student Active Status
          </div>
          <div className="notification tog">
            {popup ? (
              <i className="bi bi-toggle-off inactive"></i>
            ) : (
              <i
                className={
                  isActive
                    ? "bi bi-toggle-on active"
                    : "bi bi-toggle-off inactive"
                }
                onClick={handleStatusChange}
              ></i>
            )}
          </div>
          <div
            className={
              isActive ? "notification txt" : "notification txtinactive"
            }
          >
            {isActive ? "Active" : "Inactive"}
          </div>
          <div className={isActive ? "none" : "delete"}>
            <span class="bi material-icons" onClick={() => setPopup(true)}>
              delete
            </span>
          </div>
        </div>

        <div className="studentDetails">
          <div className="picture">
            <img src={student.picture ? student.picture : avatarp} alt="" />
          </div>
          <div className="details">
            <p>
              Full Name:{" "}
              <b>
                {" "}
                {student.firstName +
                  " " +
                  student.lastName +
                  " " +
                  student.otherName}
              </b>
            </p>
            <p>
              Gender: <b> {student.gender}</b>
            </p>
            <p>
              Phone Number: <b> {student.phone}</b>
            </p>
            <p>
              Birthday: <b> {student.birthday}</b>
            </p>
            <p>
              Email: <b> {student.email}</b>
            </p>
            <p>
              Center Choice: <b> {student.centreChoice}</b>
            </p>
            <p>
              Instrument: <b>{student.instrument}</b>
            </p>
            <p>
              Schedule: <b> {student.schedule}</b>
            </p>
            <p>
              Duration: <b> {student.duration}</b>
            </p>
            <p>
              Level: <b> {student.level}</b>
            </p>
          </div>
        </div>
      </div>

      <div className={"deletePopupNone " + (popup && "deletePopup")}>
        <h3>You want to permanently delete {student.email}!</h3>
        <p>Action cannot be undo</p>
        <div className="button">
          <button
            className="cancel btn-danger"
            onClick={() => setPopup(!popup)}
          >
            Cancel
          </button>
          <button className="proceed btn-primary" onClick={handleDelete}>
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentPage;
