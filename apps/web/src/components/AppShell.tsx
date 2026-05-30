import type { ReactNode } from "react";
import type { ActiveTab } from "../types";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

type AppShellProps = {
  activeTab: ActiveTab;
  children: ReactNode;
  onNavigate: (tab: ActiveTab) => void;
};

const titleByTab: Record<ActiveTab, string> = {
  scanner: "Funding Rate Arbitrage",
  calculator: "Profit Calculator",
  liquidation: "Liquidation Risk",
  paper: "Paper Trading",
  education: "Education Layer"
};

export function AppShell({ activeTab, children, onNavigate }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activeTab={activeTab} onNavigate={onNavigate} />
      <div className="app-workspace">
        <TopBar title={titleByTab[activeTab]} />
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
