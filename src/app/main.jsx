import { createRoot } from "react-dom/client";
import "../styles/fonts.js";
import "../styles/tokens.css";
import "../styles/components.css";
import "../config/config.css";
import "./app.css";
import "./kyte.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
