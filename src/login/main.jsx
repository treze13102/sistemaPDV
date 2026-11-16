import { createRoot } from "react-dom/client";
import "../styles/fonts.js";
import "../styles/tokens.css";
import "../styles/components.css";
import "./login.css";
import Login from "./Login.jsx";

createRoot(document.getElementById("root")).render(<Login />);
