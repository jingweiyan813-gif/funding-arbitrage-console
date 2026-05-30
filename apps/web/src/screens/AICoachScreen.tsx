import { useState } from "react";
import { explainWithAgent } from "../api/client";
import { CoachPanel } from "../components/CoachPanel";
import type { AgentMode, AgentResult } from "../types";

type CoachExample = {
  label: string;
  description: string;
  mode: AgentMode;
  payload: Record<string, unknown>;
};

const EXAMPLES: CoachExample[] = [
  {
    label: "解释示例机会",
    description: "说明一个扣费后仍为正的跨所永续机会。",
    mode: "opportunity",
    payload: {
      symbol: "BTC/USDT:USDT",
      category: "true",
      strategyType: "cross_exchange_perp",
      netEdge: 0.00025,
      hedgeability: { hedgeable: "true" },
      singleSidedStrength: "clear"
    }
  },
  {
    label: "为什么这是陷阱",
    description: "解释极端费率但不可安全对冲的候选。",
    mode: "trap",
    payload: {
      symbol: "ALT/USDT:USDT",
      category: "trap",
      strategyType: "cash_and_carry",
      singleSidedStrength: "severe",
      hedgeability: { hedgeable: "false" }
    }
  },
  {
    label: "生成模拟计划",
    description: "给出纸面交易验证步骤。",
    mode: "simulation_plan",
    payload: {
      symbol: "ETH/USDT:USDT",
      strategyType: "cash_and_carry",
      hedgeability: { hedgeable: "conditional" },
      netEdge: 0.00018
    }
  },
  {
    label: "生成复盘总结",
    description: "用示例账户数据总结模拟盘表现。",
    mode: "paper_summary",
    payload: {
      equity: 9986.42,
      realizedPnl: -8.2,
      totalFundingReceived: 3.1,
      totalFees: 6.7
    }
  }
];

export function AICoachScreen() {
  const [result, setResult] = useState<AgentResult | null>(null);
  const [activeMode, setActiveMode] = useState<AgentMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function runExample(example: CoachExample) {
    setIsLoading(true);
    setErrorMessage(null);
    setActiveMode(example.mode);

    try {
      const response = await explainWithAgent(example.mode, example.payload);
      setResult(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "AI 教练解释失败");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="scanner-screen coach-screen">
      <section className="dashboard-hero coach-hero">
        <div>
          <span className="section-kicker">AI Agent Layer</span>
          <h2>AI 套利教练</h2>
          <p>解释机会、识别陷阱、生成模拟计划和复盘总结。当前版本是 rule-based Agent，不接大模型 API。</p>
        </div>
      </section>

      <section className="coach-action-grid">
        {EXAMPLES.map((example) => (
          <button
            className={activeMode === example.mode ? "coach-action-card active" : "coach-action-card"}
            disabled={isLoading}
            key={example.mode}
            onClick={() => void runExample(example)}
            type="button"
          >
            <strong>{example.label}</strong>
            <span>{example.description}</span>
          </button>
        ))}
      </section>

      <CoachPanel errorMessage={errorMessage} isLoading={isLoading} result={result} />
    </main>
  );
}
