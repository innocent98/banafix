import "./intro.scss";

const Intro = () => {
  return (
    <div className="intro" id="intro">
      <div className="bkImg">
        <img src="assets/img/7.jpg" alt="" />
      </div>
      <div className="cont">
        <h1>Music for Everyone</h1>
        <h4>AWAKEN POSSIBILITY</h4>
        <p>
          We offer music education for individuals of just about every age and
          skill level.
        </p>
        <div className="learn">START LEARNING</div>
      </div>
    </div>
  );
};

export default Intro;
