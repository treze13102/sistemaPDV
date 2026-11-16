import { createRoot } from "react-dom/client";
import "../styles/fonts.js";
import "../styles/tokens.css";
import "../styles/components.css";
import "./config.css";
import ConfigPage from "./ConfigPage.jsx";

createRoot(document.getElementById("root")).render(<ConfigPage />);
