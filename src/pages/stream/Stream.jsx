import { Client, LocalStream } from "ion-sdk-js";
import { IonSFUJSONRPCSignal } from "ion-sdk-js/lib/signal/json-rpc-impl";
import { useEffect, useRef } from "react";

const Stream = () => {
  const pubVideo = useRef();
  const subVideo = useRef();
  let ispub, client, signal;

  //this can later be replaced by admin coming from the database
  const config = {
    iceServers: {
      urls: "stun:stun.l.google.com:19302",
    },
  };

  //this can later be replaced by admin coming from the database
  const URL = new URLSearchParams(window.location.search).get("publish");
  console.log("url", URL);
  if (URL) {
    ispub = true;
  } else {
    ispub = false;
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    signal = new IonSFUJSONRPCSignal("ws://localhost:7000/ws");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    client = new Client(signal, config);
    signal.onopen = () => client.join("test room");

    if (!ispub) {
      client.ontrack = (track, stream) => {
        console.log("got track: ", track.id, "for stream: ", stream.id);
        track.onunmute = () => {
          subVideo.current.srcObject = stream;
          subVideo.current.autoplay = true;
          subVideo.current.muted = false;

          stream.onremovetrack = () => {
            subVideo.current.srcObject = null;
          };
        };
      };
    }
  }, []);

  const start = (event) => {
    if (event) {
      LocalStream.getUserMedia({
        resolution: "vga",
        audio: true,
        codec: "vp8", //vp9 is the best
      })
        .then((media) => {
          pubVideo.current.srcObject = media;
          pubVideo.current.autoplay = true;
          pubVideo.current.controls = true;
          pubVideo.current.muted = false;
          client.publish(media);
        })
        .catch(console.error);
    } else {
      LocalStream.getDisplayMedia({
        resolution: "vga",
        video: true,
        audio: true,
        codec: "vp8",
      })
        .then((media) => {
          pubVideo.current.srcObject = media;
          pubVideo.current.autoplay = true;
          pubVideo.current.controls = true;
          pubVideo.current.muted = false;
          client.publish(media);
        })
        .catch(console.error);
    }
  };

  return (
    <div>
      {ispub ? (
        <div>
          <button id="bnt_pubcam" onClick={() => start(true)}>
            Publish camera
          </button>
          <button id="bnt_pubscreen" onClick={() => start(false)}>
            Publish Screen
          </button>
        </div>
      ) : null}

      <div>
        {ispub ? (
          <video id="pubVideo" controls ref={pubVideo}></video>
        ) : (
          <video id="subVideo" controls ref={subVideo}></video>
        )}
      </div>
    </div>
  );
};

export default Stream;
