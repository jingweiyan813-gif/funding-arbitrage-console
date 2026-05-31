export function MiniTrendCard() {
  return (
    <section className="mini-trend-card">
      <div>
        <span className="section-kicker">聚合市场费差趋势</span>
        <h3>市场费差脉冲</h3>
        <p>当前为演示用静态趋势预览，实时图表将在后续阶段接入。</p>
      </div>
      <div className="mini-trend-chart" aria-label="静态聚合费差趋势">
        <span className="trend-dot trend-dot--one" />
        <span className="trend-dot trend-dot--two" />
        <span className="trend-dot trend-dot--three" />
        <span className="trend-dot trend-dot--four" />
      </div>
    </section>
  );
}
