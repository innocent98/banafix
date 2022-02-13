import "./gallery.scss";

const Gallery = () => {
  return (
    <div className="gallery">
      <div className="imgContainer">
        <img src="assets/img/1.jpg" alt="" />
      </div>
      <div className="imgContainer">
        <img src="assets/img/3.jpg" alt="" />
      </div>
      <div className="imgContainer">
        <img src="assets/img/2.jpg" alt="" />
      </div>
      <div className="imgContainer">
        <img src="assets/img/4.jpg" alt="" />
      </div>
    </div>
  );
};

export default Gallery;
