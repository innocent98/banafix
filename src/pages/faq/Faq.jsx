import Gallery from "../gallery/Gallery";
import "./faq.scss";
import { ContactSupport } from "@material-ui/icons";
import { useEffect, useState } from "react";
// import axios from "axios";
import { axiosInstance } from "../../config";
// import ReactPlayer from "react-player/lazy";

const Faq = () => {
  const [faq, setFaq] = useState(false);
  const [faq1, setFaq1] = useState(false);
  const [faq2, setFaq2] = useState(false);
  const [faq3, setFaq3] = useState(false);
  const [faq4, setFaq4] = useState(false);
  const [faq5, setFaq5] = useState(false);
  const [faq6, setFaq6] = useState(false);
  const [faq7, setFaq7] = useState(false);

  // fetch gallery
  const [presentation, setPresentation] = useState([]);

  useEffect(() => {
    const fetchPresentation = async () => {
      const res = await axiosInstance.get("/user/presentation");
      setPresentation(res.data);
    };
    fetchPresentation();
  }, [setPresentation]);
  return (
    <div className="faq" id="faq">
      <div className="left">
        <div className="popularQ">
          <h3>
            Popular Questions <ContactSupport />
          </h3>
          <div className="content">
            <div className="wrapper">
              <i
                className={
                  faq ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq(!faq)}
              ></i>
              <h3 onClick={() => setFaq(!faq)}>
                Please i want to make enquiry about your music school during the
                break periods
              </h3>
            </div>
            <p style={faq ? { dispay: "block" } : { display: "none" }}>
              We are always opened and at our customer's service all through the
              year
              <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq1 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq1(!faq1)}
              ></i>
              <h3 onClick={() => setFaq1(!faq1)}>What do you teach?</h3>
            </div>
            <p style={faq1 ? { dispay: "block" } : { display: "none" }}>
              We teach music theory and practical classes on different musical
              instruments such as: Keyboard, drumset, guitar, violin, Saxophone
              African percussion instruments and voice training.
              <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq2 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq2(!faq2)}
              ></i>
              <h3 onClick={() => setFaq2(!faq2)}>
                Hello, i wish my children could learn something about music but
                distance.
              </h3>
            </div>
            <p style={faq2 ? { dispay: "block" } : { display: "none" }}>
              If distance is a challenge, you can sign up for our Online
              training or home lesson. <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq3 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq3(!faq3)}
              ></i>
              <h3 onClick={() => setFaq3(!faq3)}>
                Can school music club be as effective as music training centre?{" "}
              </h3>
            </div>
            <p style={faq3 ? { dispay: "block" } : { display: "none" }}>
              This is relative! But generally, music academy will be much more
              effective than school clubs because it is what they specialize in.{" "}
              <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq4 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq4(!faq4)}
              ></i>
              <h3 onClick={() => setFaq4(!faq4)}>
                Can my child join and learn without any musical instrument?
              </h3>
            </div>
            <p style={faq4 ? { dispay: "block" } : { display: "none" }}>
              {" "}
              Having a personal musical instrument is one of the requirements.{" "}
              <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq5 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq5(!faq5)}
              ></i>
              <h3 onClick={() => setFaq5(!faq5)}>
                At what age can a child start learning musical instrument?
              </h3>
            </div>
            <p style={faq5 ? { dispay: "block" } : { display: "none" }}>
              The relative age to start is between the ages of 4 and 5 years.{" "}
              <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq6 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq6(!faq6)}
              ></i>
              <h3 onClick={() => setFaq6(!faq6)}>
                Your days of operation and time?
              </h3>
            </div>
            <p style={faq6 ? { dispay: "block" } : { display: "none" }}>
              For week days: Mondays and Thursdays: 10-6pm respectively For
              weekends: Fridays: 10-6pm & Saturdays: 10-4pm respectively
              <hr />
            </p>
            <div className="wrapper">
              <i
                className={
                  faq7 ? "fa-solid fa-square-minus" : "fa-solid fa-square-plus"
                }
                onClick={() => setFaq7(!faq7)}
              ></i>
              <h3 onClick={() => setFaq7(!faq7)}>
                How much is your training fee?{" "}
              </h3>
            </div>
            <p style={faq7 ? { dispay: "block" } : { display: "none" }}>
              {" "}
              A Registration fee of #2,000 while training fee ranges based the
              training package you chose. <hr />
            </p>
          </div>
        </div>
      </div>
      <div className="right">
        <h5>Gallery</h5>
        <div className="gallery">
          <Gallery />
        </div>

        <h3>Watch Our Student Presenting</h3>
        {presentation.map((p) => (
          <div className="video" key={p._id}>
            {/* <ReactPlayer
              className="react-player"
              url={p.picture ? p.picture : "assets/img/presentation.mp4"}
              controls={true}
              loop={true}
              playing={true}
              // light
              volume={1}
              // muted
              onPause
            /> */}
            <video
              src={p.picture ? p.picture : "assets/img/presentation.mp4"}
              controls
              autoplay
              loop
              muted
            ></video>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Faq;
