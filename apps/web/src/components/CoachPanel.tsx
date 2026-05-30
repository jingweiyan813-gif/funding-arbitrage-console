import type { AgentResult } from "../types";

type CoachPanelProps = {
  result: AgentResult | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export function CoachPanel({ result, isLoading, errorMessage }: CoachPanelProps) {
  if (isLoading) {
    return <section className="coach-panel"><div className="loading-state">AI 教练正在生成规则解释...</div></section>;
  }

  if (errorMessage) {
    return <section className="coach-panel"><div className="error-banner">{errorMessage}</div></section>;
  }

  if (!result) {
    return (
      <section className="coach-panel coach-panel--empty">
        <span className="section-kicker">Rule-based Coach</span>
        <h3>选择一个教练动作</h3>
        <p>第一版 AI 套利教练使用规则模板生成解释，不调用大模型 API，也不会读取任何密钥。</p>
      </section>
    );
  }

  return (
    <section className="coach-panel">
      <div className="coach-panel-heading">
        <div>
          <span className="section-kicker">Rule-based Coach</span>
          <h3>{result.title}</h3>
        </div>
        <span className={"coach-risk-badge coach-risk-badge--" + result.riskLevel}>{result.riskLevel}</span>
      </div>
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
