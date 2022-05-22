import "./postPresentation.scss";

const PostPresentation = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };
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
              className="form-control shadow-none"
            />
          </div>
          <button className={"btn btn-success shadow-none"} type="submit">
            Upload
          </button>
        </form>
      </div>
    </div>
  );
};

export default PostPresentation;
