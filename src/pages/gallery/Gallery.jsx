import "./gallery.scss";
import { useEffect, useState } from "react";
// import axios from "axios";
import { axiosInstance } from "../../config";
import OtherTopbar from "../../components/otherTopbar/OtherTopbar";
import TopContact from "../../components/topContact/TopContact";
import OtherSidebar from "../../components/otherSidebar/OtherSidebar";
import Footer from "../../components/footer/Footer";
import Newsletter from "../newsletter/Newsletter";

const Gallery = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [img, setImg] = useState([]);

  const [presentation, setPresentation] = useState([]);

  useEffect(() => {
    const fetchPresentation = async () => {
      const res = await axiosInstance.get("/user/presentation");
      setPresentation(res.data);
    };
    fetchPresentation();
  }, [setPresentation]);

  // gallery
  useEffect(() => {
    const fectchGallery = async () => {
      const res = await axiosInstance.get("/user/gallery");
      setImg(res.data);
    };
    fectchGallery();
  }, [setImg]);

  const items = [
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
    {
      img: "https://thumbs.dreamstime.com/b/happy-person-portrait-smiling-woman-tanned-skin-curly-hair-happy-person-portrait-smiling-young-friendly-woman-197501184.jpg",
    },
  ];

  return (
    <div className="gallery">
      <TopContact />
      <OtherTopbar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <OtherSidebar menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <div className="present">
        <h3>Watch Our Student Presenting</h3>
        {presentation.map((p) => (
          <div className="video" key={p._id}>
            <video
              src={p.picture ? p.picture : "assets/img/presentation.mp4"}
              controls
              loop
              muted
            ></video>
          </div>
        ))}
      </div>
      <br />
      <h3>Album</h3>
      <div className="galleryList">
        <div className="gallery">
          {img.map((item) => (
            <img
              src={`${item.picture}?w=164&h=164&fit=crop&auto=format`}
              srcSet={`${item.picture}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
              alt={item.title}
              className="images"
              key={item._id}
            />
          ))}
        </div>
      </div>
      <br />
      <Newsletter />
      <Footer />
    </div>
  );
};

export default Gallery;
