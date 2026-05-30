export function MiniTrendCard() {
  return (
    <section className="mini-trend-card">
      <div>
        <span className="section-kicker">Aggregate Market Spread Trend</span>
        <h3>Market spread pulse</h3>
        <p>Static trend preview for demo mode. Live charting belongs to a later phase.</p>
      </div>
      <div className="mini-trend-chart" aria-label="Static aggregate spread trend">
        <span className="trend-dot trend-dot--one" />
        <span className="trend-dot trend-dot--two" />
        <span className="trend-dot trend-dot--three" />
        <span className="trend-dot trend-dot--four" />
      </div>
    </section>
  );
}
