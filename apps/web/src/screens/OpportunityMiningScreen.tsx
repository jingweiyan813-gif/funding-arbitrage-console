export function OpportunityMiningScreen() {
  return (
    <main className="scanner-screen placeholder-screen">
      <section className="placeholder-hero">
        <span className="section-kicker">入口层</span>
        <h2>机会挖掘</h2>
        <p>
          这里将作为 Phase 2.5 的全市场机会入口，后续会做全市场极端费率扫描、可对冲性闸门，以及真机会 / 陷阱的三色分区。
        </p>
      </section>

      <section className="placeholder-grid">
        <article className="placeholder-card placeholder-card--teal">
          <strong>全市场极端费率扫描</strong>
          <p>从少量示例机会扩展到多币种、多交易所的异常资金费率发现。</p>
        </article>
        <article className="placeholder-card">
          <strong>可对冲性闸门</strong>
          <p>后续会检查两侧是否都有可交易、可对冲、流动性足够的合约。</p>
        </article>
        <article className="placeholder-card placeholder-card--warning">
          <strong>真机会 / 陷阱分区</strong>
          <p>用绿色、黄色、红色区分可观察机会、需要谨慎机会和扣费后陷阱。</p>
        </article>
      </section>
    </main>
  );
}
