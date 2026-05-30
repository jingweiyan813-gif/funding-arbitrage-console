import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOpportunities } from "../api/client";
import { DashboardMetricCard } from "../components/DashboardMetricCard";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { MiniTrendCard } from "../components/MiniTrendCard";
import { OpportunityTable } from "../components/OpportunityTable";
import { RightRail } from "../components/RightRail";
import { Tooltip } from "../components/Tooltip";
import { EducationPanel } from "../edu/EducationPanel";
import { scannerEducation } from "../edu/copy";
import type { ApiSource, ArbOpportunity } from "../types";

type SortMode = "spread" | "netEdge";

const AUTO_REFRESH_MS = 30_000;

type ScannerScreenProps = {
  onCalculate: (opportunity: ArbOpportunity) => void;
  onLiquidation: (opportunity: ArbOpportunity) => void;
  onPaperTrade: (opportunity: ArbOpportunity) => void;
};

export function ScannerScreen({
  onCalculate,
  onLiquidation,
  onPaperTrade
}: ScannerScreenProps) {
  const [sort, setSort] = useState<SortMode>("spread");
  const [includeLowLiquidity, setIncludeLowLiquidity] = useState(false);
  const [source, setSource] = useState<ApiSource>("mock");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [opportunities, setOpportunities] = useState<ArbOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOpportunities = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      setErrorMessage(null);
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await fetchOpportunities({
          sort,
          includeLowLiquidity
        });
        setSource(response.source);
        setUpdatedAt(response.updatedAt);
        setErrors(response.errors);
        setOpportunities(response.data);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "无法加载套利机会"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [includeLowLiquidity, sort]
  );

  useEffect(() => {
    void loadOpportunities("initial");
  }, [loadOpportunities]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      void loadOpportunities();
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(timer);
  }, [loadOpportunities]);

  const stats = useMemo(() => {
    const maxSpread = Math.max(0, ...opportunities.map((item) => item.spread));
    const maxNetEdge = Math.max(
      0,
      ...opportunities.map((item) => item.netEdge)
    );
    const fakeCount = opportunities.filter((item) => item.fakeOpportunity)
      .length;
    const averageSpread = opportunities.length
      ? opportunities.reduce((total, item) => total + item.spread, 0) /
        opportunities.length
      : 0;

    return {
      averageSpread,
      opportunityCount: opportunities.length,
      maxSpread,
      maxNetEdge,
      fakeCount
    };
  }, [opportunities]);

  return (
    <main className="scanner-screen dashboard-screen">
      <section className="dashboard-hero">
        <div>
          <span className="section-kicker">Opportunities Dashboard</span>
          <h2>Funding Rate Arbitrage Opportunities</h2>
          <p>
            Real-time analysis of cross-exchange rate differentials. The table
            prioritizes spread, net edge, funding cadence, and paper-trading
            readiness.
          </p>
        </div>
        <div className="dashboard-filter-row" aria-label="Static filters">
          <button type="button">All Assets</button>
          <button type="button">Exchanges</button>
          <button className="dashboard-apply-button" type="button">
            Apply Filters
          </button>
        </div>
      </section>

      <section className="dashboard-metric-grid">
        <DashboardMetricCard
          detail="Cross-exchange average"
          label="Average Spread"
          tone="positive"
          value={formatPercent(stats.averageSpread, 4)}
        />
        <DashboardMetricCard
          detail="USDT perpetuals"
          label="Market Context"
          value={includeLowLiquidity ? "All liquidity" : "Mid+ liquidity"}
        />
        <DashboardMetricCard
          detail={`${stats.fakeCount} fake after fees`}
          label="Opportunity Count"
          tone={stats.opportunityCount > 0 ? "positive" : "warning"}
          value={stats.opportunityCount}
        />
        <DashboardMetricCard
          detail={updatedAt ? `Updated ${formatDateTime(updatedAt)}` : "Waiting"}
          label="Data Source"
          value={<DataSourceBadge source={source} />}
        />
      </section>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      {source === "partial" && Object.keys(errors).length > 0 ? (
        <div className="notice notice--partial">
          <strong>部分交易所实时数据可用，部分交易所暂时超时。</strong>
          <p>当前仍会使用可用数据生成机会榜，超时交易所会列在下方。</p>
          <ul>
            {Object.entries(errors).map(([exchange, message]) => (
              <li key={exchange}>
                <span>{exchange}</span>
                <p>{message}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {source === "mock" ? (
        <div className="notice notice--mock">
          当前机会榜使用 fallback 演示数据。公开行情读取链路已接入，但当前环境无法同时获取两个以上交易所数据，因此使用演示快照保证流程可展示。
        </div>
      ) : null}

      <section className="dashboard-body-grid">
        <div className="dashboard-main-column">
          <section className="table-panel opportunities-panel">
            <div className="panel-heading dashboard-panel-heading">
              <div>
                <h3>机会排行榜</h3>
                <span>{isLoading ? "加载中" : "30 秒自动刷新"}</span>
              </div>
              <div className="toolbar-actions compact-actions">
                <div className="segmented-control" aria-label="排序方式">
                  <button
                    className={sort === "spread" ? "active" : ""}
                    onClick={() => setSort("spread")}
                    type="button"
                  >
                    按费差排序
                  </button>
                  <button
                    className={sort === "netEdge" ? "active" : ""}
                    onClick={() => setSort("netEdge")}
                    type="button"
                  >
                    按净费差排序
                  </button>
                </div>
                <label className="toggle-control">
                  <input
                    checked={includeLowLiquidity}
                    onChange={(event) =>
                      setIncludeLowLiquidity(event.currentTarget.checked)
                    }
                    type="checkbox"
                  />
                  <span>包含低流动性</span>
                </label>
                <button
                  className="refresh-button"
                  disabled={isRefreshing}
                  onClick={() => void loadOpportunities()}
                  type="button"
                >
                  {isRefreshing ? "刷新中" : "手动刷新"}
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="loading-state">正在加载 Scanner 数据...</div>
            ) : (
              <OpportunityTable
                onCalculate={onCalculate}
                onLiquidation={onLiquidation}
                onPaperTrade={onPaperTrade}
                opportunities={opportunities}
              />
            )}
          </section>
        </div>
        <RightRail fakeCount={stats.fakeCount} source={source} />
      </section>

      <MiniTrendCard />

      <EducationPanel defaultCollapsed title={scannerEducation.title}>
        <ul>
          {scannerEducation.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p>
          <Tooltip
            label="结算周期"
            text="资金费率结算间隔，常见为 8 小时，也可能因交易所或品种而不同。"
          />
          越短，同样费差年化后越高，但也更依赖费率持续性。
        </p>
      </EducationPanel>
    </main>
  );
}

function formatPercent(value: number, digits: number): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}
