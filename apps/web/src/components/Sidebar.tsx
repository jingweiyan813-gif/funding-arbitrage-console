import type { ActiveTab } from "../types";

type SidebarProps = {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
};

type NavItem = {
  label: string;
  tab: ActiveTab;
  hint?: string;
};

const navItems: NavItem[] = [
  { label: "总览", tab: "scanner", hint: "Dashboard" },
  { label: "机会扫描", tab: "scanner", hint: "Opportunities" },
  { label: "收益计算", tab: "calculator", hint: "Calculator" },
  { label: "爆仓风险", tab: "liquidation", hint: "Liquidation" },
  { label: "模拟盘", tab: "paper", hint: "Paper Trading" },
  { label: "学习说明", tab: "education", hint: "Education" }
];

export function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <strong>ArbiLearn</strong>
        <span>Demo Mode Active</span>
      </div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navItems.map((item) => (
          <button
            className={activeTab === item.tab ? "active" : ""}
            key={item.label}
            onClick={() => onNavigate(item.tab)}
            type="button"
          >
            <span>{item.label}</span>
            {item.hint ? <small>{item.hint}</small> : null}
          </button>
        ))}
      </nav>
      <div className="sidebar-upgrade-card">
        <span>Upgrade to Pro</span>
        <p>Scenario planning and deeper analytics are reserved for future phases.</p>
        <button type="button">Get Pro</button>
        <small>Sync Status: Active</small>
      </div>
    </aside>
  );
}
