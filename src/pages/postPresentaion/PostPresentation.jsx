// import axios from "axios";
import { axiosInstance } from "../../config";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { decode } from "jsonwebtoken";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/Context";
import storage from "../../firebase";
import "./postPresentation.scss";

const PostPresentation = () => {
  const [picture, setPicture] = useState(null);
  const [progress, setProgress] = useState(0);
  const [click, setClick] = useState(false);
  const [success, setSuccess] = useState(false);

  const accessToken = useContext(Context);
  const { dispatch } = useContext(Context);

  const newPresentation = {
    accessToken: accessToken.accessToken,
    picture: picture,
  };

  const handleClick = (e) => {
    setClick(true);
    if (picture) {
      const uploadFile = (file) => {
        if (!file) return;
        const filename = Date.now() + file.name;
        const storageRef = ref(storage, `/presentation/${filename}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const prog = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress(prog);
          },
          (err) => console.log(err),
          () => {
            const pic = getDownloadURL(uploadTask.snapshot.ref).then((url) =>
              setPicture(url)
            );
            newPresentation.picture = pic;
          }
        );
      };
      uploadFile(picture);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await axiosInstance.post("/user/upload-presentation", newPresentation);
    try {
      if (res.status === 200) {
        setSuccess(!success);
        alert("Presentation successfully uploaded.");
        window.location.replace("/dashboard");
      }
    } catch (error) {
      if (res.status === 403) {
        alert("You are not allowed to perform this operation");
      } else if (res.status === 401) {
        alert("You are not authenticated");
      } else {
        alert("Connection Error!");
        console.log(res.status);
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
    <div className="postPresentation">
      <div className="postForm">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label htmlFor="presentaion" className="form-label">
              Presentation
            </label>
            <input
              type="file"
              accept="video/mp4, video/x-m4v, video/*"
              required
              name="picture"
              className="form-control shadow-none"
              onChange={(e) => setPicture(e.target.files[0])}
            />
            <div
              className={click ? "progress" : "none"}
              style={{ backgroundColor: "green", color: "white" }}
            >
              {progress && (
                <span
                  style={click ? { display: "block" } : { display: "none" }}
                >
                  {progress}%
                </span>
              )}
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="button btn-success"
              style={picture ? { display: "block" } : { display: "none" }}
              onClick={handleClick}
            >
              Upload picture
            </div>
          </div>
          <button
            className={"btn btn-success shadow-none"}
            type="submit"
            disabled={progress < 100}
          >
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostPresentation;
