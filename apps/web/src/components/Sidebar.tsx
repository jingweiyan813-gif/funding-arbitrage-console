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
      { label: "机会挖掘", tab: "opportunityMining", hint: "挖掘" },
      { label: "标准教学", tab: "scanner", hint: "教学" }
    ]
  },
  {
    title: "分析工具层",
    items: [
      { label: "收益计算", tab: "calculator", hint: "计算" },
      { label: "爆仓风险", tab: "liquidation", hint: "强平" }
    ]
  },
  {
    title: "账本层",
    items: [
      { label: "模拟盘", tab: "paper", hint: "模拟" },
      { label: "监控 / 告警", tab: "monitor", hint: "提醒" },
      { label: "真实账户", tab: "liveAccount", hint: "即将开放" }
    ]
  },
  {
    title: "Agent 层",
    items: [
      { label: "AI 教练", tab: "aiCoach", hint: "Agent" }
    ]
  }
];

export function Sidebar({ activeTab, onNavigate }: SidebarProps) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <strong>ArbiLearn</strong>
        <span>DEMO 模式已开启</span>
      </div>
      <nav className="sidebar-nav" aria-label="主导航">
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
        <span>高级能力预留</span>
        <p>情景推演和更深度分析会在后续阶段开放。</p>
        <button type="button">了解路线</button>
        <small>同步状态：正常</small>
      </div>
    </aside>
  );
}
