import type { AgentProvider, AgentResult, AgentSource } from "../types";

type CoachPanelProps = {
  result: AgentResult | null;
  isLoading: boolean;
  errorMessage: string | null;
  source: AgentSource | null;
  provider?: AgentProvider;
  model?: string;
  warning?: string;
};

export function CoachPanel({ result, isLoading, errorMessage, source, provider, model, warning }: CoachPanelProps) {
  if (isLoading) {
    return <section className="coach-panel"><div className="loading-state">AI 教练正在生成规则解释...</div></section>;
  }

  if (errorMessage) {
    return <section className="coach-panel"><div className="error-banner">{errorMessage}</div></section>;
  }

  if (!result) {
    return (
      <section className="coach-panel coach-panel--empty">
        <span className="section-kicker">{formatAgentSource(source, provider)}</span>
        <h3>选择一个教练动作</h3>
        <p>AI 套利教练默认使用规则模板；配置后端 LLM key 后可使用大模型，但密钥不会暴露到前端。</p>
      </section>
    );
  }

  return (
    <section className="coach-panel">
      <div className="coach-panel-heading">
        <div>
          <span className="section-kicker">{formatAgentSource(source, provider)}</span>
          <h3>{result.title}</h3>
        </div>
        <span className={"coach-risk-badge coach-risk-badge--" + result.riskLevel}>{result.riskLevel}</span>
      </div>
      {warning ? <div className="coach-warning">大模型暂不可用，已使用规则 Agent 兜底。</div> : null}
      {model && source === "llm" ? <p className="coach-model">模型：{model}</p> : null}
      <p className="coach-summary">{result.summary}</p>
      <div className="coach-list-grid">
        <div>
          <h4>解释要点</h4>
          <ul>
            {result.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
          </ul>
        </div>
        <div>
          <h4>下一步动作</h4>
          <ul>
            {result.nextActions.map((action) => <li key={action}>{action}</li>)}
          </ul>
        </div>
      </div>
      <p className="coach-disclaimer">{result.disclaimer}</p>
    </section>
  );
}

function formatAgentSource(source: AgentSource | null, provider?: AgentProvider): string {
  if (source === "llm" && provider === "mimo") return "小米 MiMo Agent";
  if (source === "llm") return "大模型 Agent";
  return "规则 Agent";
}
