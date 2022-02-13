import "./newsletter.scss";

export default function Newsletter() {
  const handleSubmit = (e) => {
    e.preventDefault();
  };
  return (
    <div className="newsletter" id="contact">
      <h2>Want to Stay Informed?</h2>
      <h5>SIGN UP FOR OUR NEWSLETTER NOW!</h5>
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <input
            type="text"
            placeholder="Your Email"
            className="form-control shadow-none"
          />
          <button type="submit" className="submit-button">
            SIGN UP
          </button>
        </div>
      </form>
    </div>
  );
}
