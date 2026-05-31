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
  opportunityMining: "机会挖掘 · Opportunity Mining",
  scanner: "标准教学 · Standard Learning",
  calculator: "收益计算 · Calculator",
  liquidation: "爆仓风险 · Liquidation",
  paper: "模拟盘 · Paper Trading",
  monitor: "监控 / 告警 · Monitor",
  liveAccount: "真实账户 · Coming Soon",
  education: "学习说明 · Education",
  aiCoach: "AI 教练 · AI Coach"
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
