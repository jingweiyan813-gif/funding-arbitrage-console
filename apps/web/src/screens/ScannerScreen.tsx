import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOpportunities } from "../api/client";
import { DataSourceBadge } from "../components/DataSourceBadge";
import { OpportunityTable } from "../components/OpportunityTable";
import { StatCard } from "../components/StatCard";
import { Tooltip } from "../components/Tooltip";
import { EducationPanel } from "../edu/EducationPanel";
import { scannerEducation } from "../edu/copy";
import type { ApiSource, ArbOpportunity } from "../types";

type SortMode = "spread" | "netEdge";

const AUTO_REFRESH_MS = 30_000;

type ScannerScreenProps = {
  onCalculate: (opportunity: ArbOpportunity) => void;
  onLiquidation: (opportunity: ArbOpportunity) => void;
};

export function ScannerScreen({
  onCalculate,
  onLiquidation
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

    return {
      opportunityCount: opportunities.length,
      maxSpread,
      maxNetEdge,
      fakeCount
    };
  }, [opportunities]);

  return (
    <main className="scanner-screen">
      <section className="toolbar">
        <div>
          <span className="section-kicker">Scanner Dashboard</span>
          <h2>资金费率套利机会</h2>
          <p className="section-copy">
            跨交易所对齐 USDT 永续合约
            <Tooltip
              label="资金费率"
              text="永续合约多空双方定期交换的费用，正数通常表示多头付、空头收。"
            />
            ，优先展示扣除 taker 费后的
            <Tooltip
              label="净费差"
              text="费差扣除两边交易手续费后的剩余边际，netEdge <= 0 时为假机会。"
            />
            。
          </p>
        </div>
        <div className="toolbar-actions">
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
      </section>

      <EducationPanel defaultCollapsed={false} title={scannerEducation.title}>
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

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      {source === "partial" && Object.keys(errors).length > 0 ? (
        <div className="notice notice--partial">
          <strong>部分交易所数据暂缺</strong>
          <p>部分交易所数据暂缺。</p>
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
          当前展示 fallback 模拟数据，真实跨所机会暂不可用。
        </div>
      ) : null}

      <section className="stats-grid">
        <StatCard
          detail={updatedAt ? `更新于 ${formatDateTime(updatedAt)}` : "等待更新"}
          label="数据来源"
          value={<DataSourceBadge source={source} />}
        />
        <StatCard label="机会数量" value={stats.opportunityCount} />
        <StatCard label="最大费差" value={formatPercent(stats.maxSpread, 4)} />
        <StatCard
          label="最大净费差"
          value={formatPercent(stats.maxNetEdge, 4)}
        />
        <StatCard label="假机会数量" value={stats.fakeCount} />
      </section>

      <section className="table-panel">
        <div className="panel-heading">
          <h3>机会排行榜</h3>
          <span>{isLoading ? "加载中" : "30 秒自动刷新"}</span>
        </div>
        {isLoading ? (
          <div className="loading-state">正在加载 Scanner 数据...</div>
        ) : (
          <OpportunityTable
            onCalculate={onCalculate}
            onLiquidation={onLiquidation}
            opportunities={opportunities}
          />
        )}
      </section>
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
