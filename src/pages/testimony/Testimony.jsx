import "./testimony.scss";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@material-ui/icons";
import { useEffect, useState } from "react";
// import { testimony } from "../../dummyData";
// import axios from "axios";
import { axiosInstance } from "../../config";

const Testimony = () => {
  const [slider, setSlider] = useState(0);
  const [testimony, setTestimony] = useState([])

  useEffect(()=>{
    const fetchTestimony = async ()=>{
      const res = await axiosInstance.get("/user/testimony")
      setTestimony(res.data)
    }
    fetchTestimony();
  },[setTestimony])

  const handleClick = (direction) => {
    if (direction === "left") {
      setSlider(slider > 0 ? slider - 1 : testimony.length - 1);
    } else {
      setSlider(slider < testimony.length - 1 ? slider + 1 : 0);
    }
  };
  return (
    <div className="testimony">
      <div className="testimonyCont">
        <h4>Read What Our Parents And Students Say About Us</h4>
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
                <img src={t.picture ? t.picture : "assets/img/avatar.png"} alt="" />
              </div>
              <div className="content">
                <p>{t.testimony}</p>
                <h4> {t.name}</h4>
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
