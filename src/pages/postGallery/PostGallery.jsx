import "./postGallery.scss";

const PostGallery = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
  };
  return (
    <div className="postGallery">
      <div className="postForm">
        <form className="row g-3" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <label htmlFor="picture" className="form-label">
              Pictures
            </label>
            <input
              type="file"
              name="galery[]"
              multiple="true"
              accept="image/png, image/jpeg"
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

export default PostGallery;
