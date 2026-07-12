import React from "react";
import { createRoot } from "react-dom/client";
import AkariChat from "./AkariChat.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AkariChat />
  </React.StrictMode>
);
