import type { ActiveTab } from "../types";

const tabs: Array<{ id: ActiveTab; label: string }> = [
  { id: "scanner", label: "Scanner" },
  { id: "calculator", label: "Calculator" },
  { id: "liquidation", label: "Liquidation" },
  { id: "paper", label: "Paper Trading" }
];

type TabNavProps = {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
};

export function TabNav({ activeTab, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Funding Arbitrage views">
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
