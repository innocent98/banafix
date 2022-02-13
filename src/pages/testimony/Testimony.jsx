import Gallery from "../gallery/Gallery";
import "./testimony.scss";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@material-ui/icons";
import { useState } from "react";
import { testimony } from "../../dummyData";

const Testimony = () => {
  const [slider, setSlider] = useState(0);

  const handleClick = (direction) => {
    if (direction === "left") {
      setSlider(slider > 0 ? slider - 1 : 2);
    } else {
      setSlider(slider < 2 ? slider + 1 : 0);
    }
  };
  return (
    <div className="testimony">
      <div className="left">
        <h5>Gallery</h5>
        <div className="gallery">
          <Gallery />
        </div>
      </div>
      <div className="right">
        <h4>Listen to What our Parents and Students Says</h4>
        <div
          className="slider"
          style={{
            transform: `translateX(${slider * -50}vw)`,
          }}
          slider={slider}
        >
          {testimony.map((t) => (
            <div className="container" key={t.id}>
              <div className="picture">
                <img src={t.picture} alt="" />
              </div>
              <div className="content">
                <p>{t.testimonial}</p>
                <h4> {t.firstName}</h4>
                <h6>{t.instrument}</h6>
              </div>
            </div>
          ))}
        </div>

        <div className="slide">
          <ArrowLeftOutlined
            className="arrow"
            onClick={() => handleClick("left")}
          />
          <ArrowRightOutlined
            className="arrow"
            onClick={() => handleClick("right")}
          />
        </div>
      </div>
    </div>
  );
};

export default Testimony;
