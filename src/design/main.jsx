import { createRoot } from "react-dom/client";
import "../styles/fonts.js";
import "../styles/tokens.css";
import "../styles/components.css";
import "../login/login.css";
import "../config/config.css";
import "./design.css";
import DesignSystem from "./DesignSystem.jsx";

createRoot(document.getElementById("root")).render(<DesignSystem />);
