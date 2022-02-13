import "./about.scss";

const About = () => {
  return (
    <div className="about" id="about">
      <div className="left">
        <h1>About Banafix Music</h1>
        <div className="who">
          <h4>WHO WE ARE</h4>
          <p>
            Banafix music is a system where musical and artistic talents of
            individuals are discovered, developed and deployed for personal
            fulfillment and positive societal impacts across the globe.
          </p>
          <h4>VISION STATEMENT</h4>
          <p>
            An organization where professional musicians are raised for personal
            fulfillment and for positive global impacts
          </p>
          <h4>MISSION</h4>
          <p>
            To create an integrated platforms that discover, develop and deploy
            music and artistic potentials.
          </p>
          <h4>OBJECTIVE</h4>
          <p>
            Our objective is to identify, raise and build potential leaders we
            come in contact with through our networking arms by our organization
            values
          </p>
          <img src="assets/img/3.jpg" alt="" />
        </div>
      </div>
      <div className="right">
        <img src="assets/img/8.jpg" alt="" />
        <div className="value">
          <h2>OUR CORE VALUES</h2>
          <div className="cores">
            <div className="cont">
              <h4>Godliness: </h4>
              <p>
                Believing in God and in the importance of living a moral life.
              </p>
            </div>
            <div className="cont">
              <h4>Teamwork: </h4>
              <p>
                Work done by several associates with each doing a part but all
                subordinating personal prominence to the efficiency of the
                whole.
              </p>
            </div>
            <div className="cont">
              <h4>Excellent service delivery:</h4>
              <p>
                We believe in excellent service delivery and customers's
                satisfaction
              </p>
            </div>
            <div className="cont">
              <h4>Passion:</h4>
              <p>
                We are enthusiastic and passionate about what we do and how we
                perform our duties
              </p>
            </div>
            <div className="cont">
              <h4>Integrity:</h4>
              <p>
                We are honest and fair in our dealings. Thers's integration of
                our words and behavior. i.e we say what we do and we do what we
                say
              </p>
            </div>
            <div className="cont">
              <h4>Legacy:</h4>
              <p>
                Webelieve this is a generational course, so we are very
                delibrate in the knowledge we impact hereby living good
                exemplary life.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
