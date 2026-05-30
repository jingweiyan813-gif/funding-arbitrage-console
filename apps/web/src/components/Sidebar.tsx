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

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "入口层",
    items: [
      { label: "机会挖掘", tab: "opportunityMining", hint: "Mining" },
      { label: "标准教学", tab: "scanner", hint: "Scanner" }
    ]
  },
  {
    title: "分析工具层",
    items: [
      { label: "收益计算", tab: "calculator", hint: "Calculator" },
      { label: "爆仓风险", tab: "liquidation", hint: "Liquidation" }
    ]
  },
  {
    title: "账本层",
    items: [
      { label: "模拟盘", tab: "paper", hint: "Paper Trading" },
      { label: "监控 / 告警", tab: "monitor", hint: "Monitor" },
      { label: "真实账户", tab: "liveAccount", hint: "Coming Soon" }
    ]
  },
  {
    title: "Agent 层",
    items: [
      { label: "AI 教练", tab: "aiCoach", hint: "Rule-based" }
    ]
  }
];

export function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <strong>ArbiLearn</strong>
        <span>Demo Mode Active</span>
      </div>
      <nav className="sidebar-nav" aria-label="Dashboard navigation">
        {navGroups.map((group) => (
          <section className="sidebar-nav-group" key={group.title}>
            <span className="sidebar-group-title">{group.title}</span>
            {group.items.map((item) => (
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
          </section>
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
