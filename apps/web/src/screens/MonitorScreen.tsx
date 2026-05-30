export function MonitorScreen() {
  return (
    <main className="scanner-screen placeholder-screen">
      <section className="placeholder-hero">
        <span className="section-kicker">账本层</span>
        <h2>监控 / 告警</h2>
        <p>
          这里是 Phase 2.5 之后的轻量监控占位。后续会围绕费率反转、接近强平、机会失效提醒进行整理。
        </p>
      </section>

      <section className="placeholder-grid">
        <article className="placeholder-card placeholder-card--warning">
          <strong>费率反转提醒</strong>
          <p>当原本收取资金费的一侧变成付费方向时，提醒重新评估机会。</p>
        </article>
        <article className="placeholder-card placeholder-card--danger">
          <strong>接近强平提醒</strong>
          <p>当任一腿安全垫过低时，提示降低杠杆或退出模拟仓位。</p>
        </article>
        <article className="placeholder-card">
          <strong>机会失效提醒</strong>
          <p>当净费差、流动性或可对冲性不再满足条件时，提示机会过期。</p>
        </article>
      </section>
    </main>
  );
}
