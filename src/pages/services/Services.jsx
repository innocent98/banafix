import "./services.scss";

const Services = () => {
  return (
    <div className="services" id="services">
      <div className="left">
        <h1>Our Music Group</h1>
        <p>
          We offer music education for individuals of just about every age and
          skill level. (Kids, Teens and Adults. Private lessons(On site and
          Online))
        </p>
        <div className="group">
          <h4>KIDS & TEENS</h4>
          <p>
            Kids if ages 4-12 and teenagers are introduced early to music and
            art to aid their physical, social and mental development.
          </p>
          <h4>ADULTS</h4>
          <p>
            Since there is no as limitation in learning, adults of different
            ages can also emrol for music learning.
          </p>
          <h4>PRIVATE & HOME LESSONS</h4>
          <p>
            As desired by respective students, private lessons and home lessons
            services are available. Students hereby have one on one learning
            time with thier respective tutors either at the training centre or
            at their respective homes(Home lessons).
          </p>
        </div>
      </div>
      <div className="right">
        <img src="assets/img/1.jpg" alt="" />
        <div className="instrument">
          <h2>Musical Instruments</h2>
          <div className="eachInstrument">
            <div className="cont">
              <img src="" alt="" />
              <h4>Piano</h4>
              <p>It is a musical instrument played using a keyboard.</p>
            </div>
            <div className="cont">
              <img src="" alt="" />
              <h4>Guitar</h4>
              <p>The guitar is classified as a string instrument.</p>
            </div>
          </div>
          <div className="eachInstrument">
            <div className="cont">
              <img src="" alt="" />
              <h4>Voice</h4>
              <p>It is a type of music performed by one or more singers.</p>
            </div>
            <div className="cont">
              <img src="" alt="" />
              <h4>Drums</h4>
              <p>Can play by striking with the hand or two sticks.</p>
            </div>
          </div>
          <div className="eachInstrument">
            <div className="cont">
              <img src="" alt="" />
              <h4>Violin</h4>
              <p>The violin has four strings tuned in perfect fifths.</p>
            </div>
            <div className="cont">
              <img src="" alt="" />
              <h4>Saxophone</h4>
              <p>The saxophone is a woodwind instrument.</p>
            </div>
          </div>
          <div className="eachInstrument"></div>
        </div>
      </div>
    </div>
  );
};

export default Services;
