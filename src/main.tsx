import React from "react";
import { createRoot } from "react-dom/client";
import { WorldZeroGame } from "./components/WorldZeroGame";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><WorldZeroGame /></React.StrictMode>);
