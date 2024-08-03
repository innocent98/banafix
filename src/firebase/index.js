// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC5iYQ8NgPrWgk-MnH-sO44HT1sDIp_eM8",
  authDomain: "banafix-music.firebaseapp.com",
  projectId: "banafix-music",
  storageBucket: "banafix-music.appspot.com",
  messagingSenderId: "957861720521",
  appId: "1:957861720521:web:8b28c231503814facdf818",
  measurementId: "G-RCQPZKXGS0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app, "gs://banafix-music.appspot.com");

export default storage;