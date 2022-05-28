import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "https://banafix-api.herokuapp.com/api/",
});
