import "./postEvent.scss";

export default function PostEvent() {
  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="postEvent">
      <div className="postForm">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label htmlFor="design" className="form-label">
              Event Design
            </label>
            <input
              type="file"
              accept="image/png, image/jpeg"
              required
              className="form-control shadow-none"
            />
          </div>
          <div className="col-md-6">
            <label htmlFor="date" className="form-label">
              Event Date
            </label>
            <input type="date" required className="form-control shadow-none" />
          </div>
          <div className="col-md-6">
            <label htmlFor="title" className="form-label">
              Event Title
            </label>
            <input type="text" required className="form-control shadow-none" />
          </div>
          <div className="col-md-6">
            <label htmlFor="desc" className="form-label">
              Event Description
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
}
