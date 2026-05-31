import type { ActiveTab } from "../types";

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "scanner", label: "标准教学" },
  { id: "calculator", label: "收益计算" },
  { id: "liquidation", label: "爆仓风险" },
  { id: "paper", label: "模拟盘" }
];

type TabNavProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

export function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="资金费率套利视图">
      {tabs.map((tab) => (
        <button
          className={activeTab === tab.id ? "active" : ""}
          key={tab.id}
          onClick={() => onChange(tab.id)}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
