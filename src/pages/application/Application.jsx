import { useState } from "react";
import "./application.scss";
import { CheckCircle } from "@material-ui/icons";

const Application = () => {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
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
          <div className="col-md-6">
            <label htmlFor="fullName" className="form-label">
              Full Name
            </label>
            <input type="text" required className="form-control shadow-none" />
          </div>
          <div className="col-md-6">
            <label htmlFor="address" className="form-label">
              Address
            </label>
            <input type="text" required className="form-control shadow-none" />
          </div>
          <div className="col-md-6">
            <label htmlFor="gender" className="form-label">
              Gender
            </label>
            <select
              name="gender"
              id="gender"
              className="form-select shadow-none"
              required
            >
              <option defaultValue="male">M</option>
              <option value="female">F</option>
            </select>
          </div>
          <div className="col-md-6">
            <label htmlFor="instrument" className="form-label">
              Instrument
            </label>
            <select
              name="instrument"
              id="instrument"
              className="form-select shadow-none"
              required
            >
              <option value="">Select an Instrument to learn</option>
              <option value="piano">Piano</option>
              <option value="guitar">Guitar</option>
              <option value="sax">Saxophone</option>
              <option value="voice">Voice</option>
              <option value="drum">Drum</option>
              <option value="violin">Violin</option>
            </select>
          </div>
          <button
            className={"btn btn-success shadow-none " + (success && "active")}
            type="submit"
            disabled={success}
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default Application;
