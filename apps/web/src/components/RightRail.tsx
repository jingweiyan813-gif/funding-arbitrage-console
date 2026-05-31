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
        <span>提示</span>
        <h3>净费差优先于费差</h3>
        <p>费差最大不代表利润最大。先看净费差，再进入模拟盘观察手续费、滑点和强平风险。</p>
      </section>
      <section className="rail-card rail-card--risk">
        <span>风险提醒</span>
        <h3>{fakeCount} 个假机会</h3>
        <p>净费差小于等于 0 的机会会被标记为假机会，适合演示扣费后的收益反转。</p>
      </section>
      <section className="rail-card rail-card--simulator">
        <span>模拟验证</span>
        <h3>先做纸面模拟</h3>
        <p>在标准教学中点击“模拟建仓”，会带入模拟盘面板。全程不接 API Key、不真实下单。</p>
        <DataSourceBadge source={source} />
      </section>
    </aside>
  );
}
