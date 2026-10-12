import axios from "axios";

// Same-origin through the Vite proxy, so the login cookie is sent automatically
export default axios.create({ baseURL: "/api" });