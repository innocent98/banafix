import "./gallery.scss";
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import { useEffect, useState } from "react";
// import axios from "axios";
import { axiosInstance } from "../../config";

const Gallery = () => {
  const [img, setImg] = useState([])
  
  useEffect(() => {
    const fectchGallery = async () => {
      const res = await axiosInstance.get("/user/gallery");
      setImg(res.data);
    };
    fectchGallery();
  }, [setImg]);
  
  return (
    <ImageList sx={{ width: 500, height: 450 }} cols={3} rowHeight={164}>
      {img.map((item) => (
        <ImageListItem key={item.img}>
          <img
            src={`${item.picture}?w=164&h=164&fit=crop&auto=format`}
            srcSet={`${item.picture}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
            alt={item.title}
            loading="lazy"
          />
        </ImageListItem>
      ))}
    </ImageList>
  );
}


export default Gallery;
