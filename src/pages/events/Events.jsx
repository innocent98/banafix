import "./events.scss";
import axios from "axios";
import { useEffect, useState } from "react";

export default function Events() {
  const [event, setEvent] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      const res = await axios.get("/user/events/");
      setEvent(res.data);
    };
    fetchEvent();
  }, [setEvent]);
  return (
    <>
      {event.map((e) => (
        <div className="events" key={e._id}>
          <div className="left">
            <img
              src={
                e.picture
                  ? e.picture
                  : "http://www.djtommyb.com/images/question-mark2.jpg"
              }
              alt=""
            />
          </div>
          <div className="right">
            <h2>Next Event</h2>
            <h5>{e.date ? e.date : "December, 2022."}</h5>
            <h1>{e.title ? e.title : "??"}</h1>
            <p>{e.desc? e.desc : "??"}</p>
          </div>
        </div>
      ))}
    </>
  );
}
