import "./postTestimonial.scss";

const PostTestimonial = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="postTestimonial">
      <div className="postForm">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label htmlFor="picture" className="form-label">
              Picture
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              required
              className="form-control shadow-none"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="testimony" className="form-label">
              Testimony
            </label>
            <input type="text" required className="form-control shadow-none" />
          </div>
          <div className="col-md-6">
            <label htmlFor="name" className="form-label">
              Name
            </label>
            <input type="text" required className="form-control shadow-none" />
          </div>
          <div className="col-md-6">
            <label htmlFor="instrument" className="form-label">
              Instrument
            </label>
            <input type="text" required className="form-control shadow-none" />
          </div>
          <button className={"btn btn-success shadow-none"} type="submit">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostTestimonial;
