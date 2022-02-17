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
        <div className="otherServices">
          <h2>OUR SERVICES</h2>
          <p>
            *Musical instruments sales and merchandise *School Consultations:
            For music teaching, trainings and events. *Event management *Artist
            Management *Music production.
          </p>
        </div>
      </div>

      <div className="right">
        <img src="assets/img/1.jpg" alt="" />
        <div className="instrument">
          <h2>Musical Instruments</h2>
          <div className="eachInstrument">
            <div className="cont">
              <h4>Piano</h4>
              <img
                src="https://www.musicnotes.com/images2/promos/store/900x520_piano-min.jpg"
                alt=""
              />
              <p>It is a musical instrument played using a keyboard.</p>
            </div>
            <div className="cont">
              <h4>Guitar</h4>
              <img
                src="https://images.squarespace-cdn.com/content/v1/5b7d8ac7697a988b951bdc95/1611728210677-016BGGS79ZRHB96CKQS3/image-9.jpg?format=2500w"
                alt=""
              />
              <p>The guitar is classified as a string instrument.</p>
            </div>
          </div>
          <div className="eachInstrument">
            <div className="cont">
              <h4>Voice</h4>
              <img
                src="https://blog.bridgebetween.com/wp-content/uploads/2018/09/up-close-picture-of-microphone-speech-presentation-public-speaking-750x410.jpg"
                alt=""
              />
              <p>It is a type of music performed by one or more singers.</p>
            </div>
            <div className="cont">
              <h4>Drums</h4>
              <img
                src="https://play-lh.googleusercontent.com/NIXe3e5cJlhOezNpfOfM0RM_7BVy0a-S20hLWjyQPN8AqhZI03C0B3Tf7fPdMoKhnw"
                alt=""
              />
              <p>Can play by striking with the hand or two sticks.</p>
            </div>
          </div>
          <div className="eachInstrument">
            <div className="cont">
              <h4>Violin</h4>
              <img
                src="https://www.nonamehiding.com/wp-content/uploads/2020/08/31-Most-Famous-Violin-Solos-You-May-Love.jpg"
                alt=""
              />
              <p>The violin has four strings tuned in perfect fifths.</p>
            </div>
            <div className="cont">
              <h4>Saxophone</h4>
              <img
                src="https://i.cbc.ca/1.5484475.1589565611!/fileImage/httpImage/saxophone.jpg"
                alt=""
              />
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
