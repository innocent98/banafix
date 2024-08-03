import { useRef } from "react";
import emailjs from "@emailjs/browser";
import "./contact.scss";

export default function Contact() {
  const formRef = useRef();
  const handleSubmit = async (e) => {
    e.preventDefault();
    emailjs
      .sendForm(
        "service_k9taoqe",
        "template_iftuf2m",
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
    alert("Thanks for conntacting us! We will get back to you shortly.");
    window.location.replace("/")
  };

  return (
    <div className="postEvent">
      <div className="postForm">
        <form className="row g-3" ref={formRef} onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label htmlFor="from_name" className="form-label">
              Full Name
            </label>
            <input
              type="text"
              required
              name="from_name"
              className="form-control shadow-none"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="text"
              required
              name="from_email"
              className="form-control shadow-none"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="title" className="form-label">
              Title
            </label>
            <input
              type="text"
              required
              name="from_title"
              className="form-control shadow-none"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="message" className="form-label">
              Message
            </label>
            <textarea
              type="text"
              required
              name="message"
              className="form-control shadow-none"
            />
          </div>
          <button className={"btn btn-success shadow-none"} type="submit">
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
