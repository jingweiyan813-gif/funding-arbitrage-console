import React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Header } from "./components/Header";
import { RiskBanner } from "./components/RiskBanner";
import { TabNav } from "./components/TabNav";
import { CalculatorScreen } from "./screens/CalculatorScreen";
import { LiquidationScreen } from "./screens/LiquidationScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import type {
  ActiveTab,
  ArbOpportunity,
  CalculatorSeed,
  LiquidationSeed
} from "./types";
import "./style.css";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("scanner");
  const [calculatorSeed, setCalculatorSeed] = useState<CalculatorSeed | null>(
    null
  );
  const [liquidationSeed, setLiquidationSeed] =
    useState<LiquidationSeed | null>(null);

  function handleCalculate(opportunity: ArbOpportunity) {
    setCalculatorSeed({
      symbol: opportunity.symbol,
      legA: opportunity.legA,
      legB: opportunity.legB,
      notional: 1000,
      cycles: 1,
      intervalHours: opportunity.intervalHours,
      slippageBps: 5
    });
    setActiveTab("calculator");
  }

  function handleLiquidation(opportunity: ArbOpportunity) {
    setLiquidationSeed({
      symbol: opportunity.symbol,
      markPrice: 50000,
      legA: {
        side: opportunity.legA.side
      },
      legB: {
        side: opportunity.legB.side
      },
      leverage: 3,
      margin: 500,
      maintMarginRate: 0.005
    });
    setActiveTab("liquidation");
  }

  return (
    <>
      <Header />
      <RiskBanner />
      <TabNav activeTab={activeTab} onChange={setActiveTab} />
      {activeTab === "scanner" ? (
        <ScannerScreen
          onCalculate={handleCalculate}
          onLiquidation={handleLiquidation}
        />
      ) : null}
      {activeTab === "calculator" ? (
        <CalculatorScreen
          key={calculatorSeed ? JSON.stringify(calculatorSeed) : "default"}
          seed={calculatorSeed}
        />
      ) : null}
      {activeTab === "liquidation" ? (
        <LiquidationScreen
          key={liquidationSeed ? JSON.stringify(liquidationSeed) : "default"}
          seed={liquidationSeed}
        />
      ) : null}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
