import React from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

function App() {
  return (
    <main>
      <h1>Funding Arbitrage Console</h1>
      <p>Phase 1 Dashboard</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
