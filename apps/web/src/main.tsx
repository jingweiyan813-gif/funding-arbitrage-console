import React from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/Header";
import { RiskBanner } from "./components/RiskBanner";
import { ScannerScreen } from "./screens/ScannerScreen";
import "./style.css";

function App() {
  return (
    <>
      <Header />
      <RiskBanner />
      <ScannerScreen />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
