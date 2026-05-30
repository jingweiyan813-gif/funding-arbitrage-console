import React from "react";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppShell } from "./components/AppShell";
import { RiskModal } from "./components/RiskModal";
import { CalculatorScreen } from "./screens/CalculatorScreen";
import { EducationScreen } from "./screens/EducationScreen";
import { LiquidationScreen } from "./screens/LiquidationScreen";
import { LiveAccountComingSoon } from "./screens/LiveAccountComingSoon";
import { MonitorScreen } from "./screens/MonitorScreen";
import { OpportunityMiningScreen } from "./screens/OpportunityMiningScreen";
import { PaperTradingScreen } from "./screens/PaperTradingScreen";
import { ScannerScreen } from "./screens/ScannerScreen";
import type {
  ActiveTab,
  ArbOpportunity,
  CalculatorSeed,
  LiquidationSeed,
  PaperSeed
} from "./types";
import "./style.css";

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("opportunityMining");
  const [calculatorSeed, setCalculatorSeed] = useState<CalculatorSeed | null>(
    null
  );
  const [liquidationSeed, setLiquidationSeed] =
    useState<LiquidationSeed | null>(null);
  const [paperSeed, setPaperSeed] = useState<PaperSeed | null>(null);

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

  function handlePaperTrade(opportunity: ArbOpportunity) {
    setPaperSeed(opportunity);
    setActiveTab("paper");
  }

  return (
    <>
      <RiskModal />
      <AppShell activeTab={activeTab} onNavigate={setActiveTab}>
        {activeTab === "opportunityMining" ? (
          <OpportunityMiningScreen
            onCalculate={handleCalculate}
            onLiquidation={handleLiquidation}
            onPaperTrade={handlePaperTrade}
          />
        ) : null}
        {activeTab === "scanner" ? (
          <ScannerScreen
            onCalculate={handleCalculate}
            onLiquidation={handleLiquidation}
            onPaperTrade={handlePaperTrade}
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
        {activeTab === "paper" ? <PaperTradingScreen seed={paperSeed} /> : null}
        {activeTab === "monitor" ? <MonitorScreen /> : null}
        {activeTab === "liveAccount" ? <LiveAccountComingSoon /> : null}
        {activeTab === "education" ? <EducationScreen /> : null}
      </AppShell>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
