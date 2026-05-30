import { RiskBanner } from "../components/RiskBanner";
import { EducationPanel } from "../edu/EducationPanel";
import { calculatorEducation, liquidationEducation, scannerEducation } from "../edu/copy";

export function EducationScreen() {
  return (
    <main className="scanner-screen education-dashboard">
      <section className="dashboard-hero">
        <div>
          <span className="section-kicker">Education Layer</span>
          <h2>Learn before simulating</h2>
          <p>资金费率套利不是稳赚。这里保留 Phase 1 的学习说明和风险提示，帮助把收益、费用和爆仓风险放在同一张图里理解。</p>
        </div>
      </section>
      <RiskBanner />
      <EducationPanel defaultCollapsed={false} title={scannerEducation.title}>
        <ul>{scannerEducation.points.map((point) => <li key={point}>{point}</li>)}</ul>
      </EducationPanel>
      <EducationPanel defaultCollapsed={false} title={calculatorEducation.title}>
        <ul>{calculatorEducation.points.map((point) => <li key={point}>{point}</li>)}</ul>
      </EducationPanel>
      <EducationPanel defaultCollapsed={false} title={liquidationEducation.title}>
        <ul>{liquidationEducation.points.map((point) => <li key={point}>{point}</li>)}</ul>
      </EducationPanel>
    </main>
  );
}
