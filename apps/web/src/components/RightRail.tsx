import { DataSourceBadge } from "./DataSourceBadge";
import type { ApiSource } from "../types";

type RightRailProps = {
  fakeCount: number;
  source: ApiSource;
};

export function RightRail({ fakeCount, source }: RightRailProps) {
  return (
    <aside className="right-rail">
      <section className="rail-card rail-card--tip">
        <span>Pro Tip</span>
        <h3>净费差优先于费差</h3>
        <p>费差最大不代表利润最大。先看 netEdge，再进入模拟盘观察手续费、滑点和强平风险。</p>
      </section>
      <section className="rail-card rail-card--risk">
        <span>Risk Alert</span>
        <h3>{fakeCount} fake opportunities</h3>
        <p>netEdge 小于等于 0 的机会会被标记为假机会，适合拿来教学演示扣费后的反转。</p>
      </section>
      <section className="rail-card rail-card--simulator">
        <span>Profit Simulator</span>
        <h3>Paper first</h3>
        <p>Scanner 中点击“模拟建仓”，会带入 Paper Trading 面板。全程不接 API Key、不真实下单。</p>
        <DataSourceBadge source={source} />
      </section>
    </aside>
  );
}
