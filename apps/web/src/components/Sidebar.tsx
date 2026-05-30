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
  { label: "Dashboard", tab: "scanner", hint: "Overview" },
  { label: "Opportunities", tab: "scanner", hint: "Scanner" },
  { label: "Calculator", tab: "calculator" },
  { label: "Liquidation", tab: "liquidation" },
  { label: "Paper Trading", tab: "paper" },
  { label: "Education", tab: "education" }
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
