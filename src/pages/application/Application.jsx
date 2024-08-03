import { useState } from "react";
import "./application.scss";
import { uploadBytesResumable, getDownloadURL, ref } from "firebase/storage";
import storage from "../../firebase";
import { CheckCircle } from "@material-ui/icons";
// import axios from "axios";
import { axiosInstance } from "../../config";
import { useRef } from "react";
import emailjs from "@emailjs/browser";

const Application = () => {
  const formRef = useRef();

  const [success, setSuccess] = useState(false);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [otherName, setOtherName] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("");
  const [birthday, setBirthday] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [centreChoice, setCentreChoice] = useState("");
  const [instrument, setInstrument] = useState("");
  const [duration, setDuration] = useState("");
  const [level, setLevel] = useState("");
  const [picture, setPicture] = useState(null);
  const [click, setClick] = useState(false);
  const [progress, setProgress] = useState(0);

  const newApplicant = {
    lastName,
    firstName,
    otherName,
    address,
    gender,
    birthday,
    email,
    phone,
    centreChoice,
    instrument,
    duration,
    level,
    picture: picture,
  };

  const handleClick = (e) => {
    setClick(true);
    if (picture) {
      const uploadFile = (file) => {
        if (!file) return;
        const filename = Date.now() + file.name;
        const storageRef = ref(storage, `/applicants/${filename}`);
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
            newApplicant.picture = pic;
          }
        );
      };
      uploadFile(picture);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/student/apply", newApplicant);
      emailjs
        .sendForm(
          "service_k9taoqe",
          "template_1a267mi",
          formRef.current,
          "AKzrg6RY738qBeVa0"
        )
        .then(
          (result) => {
            console.log(result.text);
          },
          (error) => {
            console.log(error);
          }
        );
      setSuccess(true);
    } catch (error) {}
  };

  const [check, setCheck] = useState(false);
  const handleCheck = (e) => {
    e.preventDefault();
    setCheck(!check);
  };

  return (
    <div className="applicationBody">
      {success && (
        <div className="success">
          <h5>Application form submitted</h5>
          <CheckCircle className="check" />
          <a href="/">Go back to Homepage</a>
        </div>
      )}
      <div className={"application " + (success && "active")}>
        <form className="row g-3" onSubmit={handleSubmit}>
          <h3>Application Form</h3>
          <div className="col-md-6">
            <form ref={formRef} onSubmit={handleSubmit}>
              <label htmlFor="lastName" className="form-label">
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                required
                className="form-control form-control-sm shadow-none"
                onChange={(e) => setLastName(e.target.value.toLowerCase())}
              />
            </form>
          </div>
          <div className="col-md-6">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              type="text"
              required
              name="firstName"
              className="form-control form-control-sm shadow-none"
              onChange={(e) => setFirstName(e.target.value.toLowerCase())}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="otherName" className="form-label">
              Other Name(s)
            </label>
            <input
              type="text"
              name="otherName"
              required
              className="form-control form-control-sm shadow-none"
              onChange={(e) => setOtherName(e.target.value.toLowerCase())}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input
              type="text"
              name="address"
              required
              className="form-control form-control-sm shadow-none"
              onChange={(e) => setAddress(e.target.value.toLowerCase())}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="birthday" className="form-label">
              Birthday
            </label>
            <input
              type="date"
              required
              name="birthday"
              className="form-control form-control-sm shadow-none"
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="gender" className="form-label">
              Gender
            </label>
            <select
              name="gender"
              id="gender"
              className="form-select form-select-sm shadow-none"
              required
              onChange={(e) => setGender(e.target.value.toLowerCase())}
            >
              <option value="">Select your gender</option>
              <option value="male">M</option>
              <option value="female">F</option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              className="form-control form-control-sm shadow-none email"
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="mobile" className="form-label">
              Mobile
            </label>
            <input
              type="number"
              name="phone"
              required
              className="form-control form-control-sm shadow-none"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="instrument" className="form-label">
              Instrument
            </label>
            <select
              name="instrument"
              id="instrument"
              className="form-select form-select-sm shadow-none"
              required
              onChange={(e) => setInstrument(e.target.value.toLowerCase())}
            >
              <option value="">Select an Instrument to learn</option>
              <option value="piano">Piano</option>
              <option value="guitar">Guitar</option>
              <option value="sax">Saxophone</option>
              <option value="drum">Drum</option>
              <option value="violin">Violin</option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="regOptn" className="form-label">
              I'm registering for
            </label>
            <select
              name="centreChoice"
              id="centreChoice"
              className="form-select form-select-sm shadow-none"
              required
              onChange={(e) => setCentreChoice(e.target.value.toLowerCase())}
            >
              <option value="">Select training choice</option>
              <option value="private">Private music lesson</option>
              <option value="general">
                General music lesson(Training centre)
              </option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="duration" className="form-label">
              Duration
            </label>
            <select
              name="duration"
              id="duration"
              className="form-select form-select-sm shadow-none"
              required
              onChange={(e) => setDuration(e.target.value.toLowerCase())}
            >
              <option value="">Select duration of learning</option>
              <option value="4weeks">4weeks(1month)</option>
              <option value="3months">3months</option>
              <option value="6months">6months</option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="level" className="form-label">
              Level
            </label>
            <select
              name="level"
              id="level"
              className="form-select form-select-sm shadow-none"
              required
              onChange={(e) => setLevel(e.target.value.toLowerCase())}
            >
              <option value="">Select your level</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
            </select>
          </div>
          <div className="col-md-12">
            <p>
              *Training Schedule: (Twice per week/Once a week) <br /> Week days:
              Mon & Thurs Time: 4-6pm resp. Weekends: Fri(4-6pm) & Sat(10-12pm){" "}
              <br /> NB: Crash programs are also available
            </p>
            <p>
              *TRAINING FEE(For one musical instrument and music theory)
              Registration form fee: #1,000(Non negotiable) Monthly: #15,000:00
              Periodically(3months): #40,000:00 <br /> <br /> ACCOUNT
              DETAILS(Payment for registration and tuition fee) <br /> Name:{" "}
              <b>Dada John Ifedayo</b> <br /> Account: <b>0032596442</b> <br />{" "}
              Bank: <b>Sterling Bank</b> <br /> (NB: Payment should be made once
              or considerably 70/30. 70% at registration point and 30% after 3rd
              week or ending of the 1st month).
            </p>
          </div>
          <div className="col-md-4">
            <label htmlFor="picture" className="form-label">
              Picture
            </label>
            <input
              type="file"
              name="picture"
              accept="image/jpeg, image/png"
              className="form-input form-input-shadow-none"
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
          <div className="col-md-12">
            <div class="form-check">
              <input
                class="form-check-input form-check-input-shadow-none"
                type="checkbox"
                name="flexRadioDefault"
                id="flexRadioDefault1"
                required
                onInput={handleCheck}
              />
              <label class="form-check-label" for="flexRadioDefault1">
                I with the name above as one of the students undergoing music
                training at banafix music academy, i shall abide by the rules &
                conducts guiding the smooth running of the academy & I shall be
                fully responsible for any damage of property incurred by me.
              </label>
            </div>
          </div>
          <button
            className={"btn btn-success shadow-none " + (success && "active")}
            type="submit"
            disabled={progress < 100 || !check}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Application;
