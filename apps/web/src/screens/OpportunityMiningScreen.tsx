import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMiningOpportunities } from "../api/client";
import { MiningCategoryCard } from "../components/MiningCategoryCard";
import { MiningFilters } from "../components/MiningFilters";
import { MiningOpportunityTable } from "../components/MiningOpportunityTable";
import type { ArbOpportunity, MinedOpportunity, MiningCategory, MiningSource } from "../types";

type OpportunityMiningScreenProps = {
  onCalculate: (opportunity: ArbOpportunity) => void;
  onLiquidation: (opportunity: ArbOpportunity) => void;
  onPaperTrade: (opportunity: ArbOpportunity) => void;
};

const CATEGORY_COPY: Record<MiningCategory, { title: string; description: string }> = {
  true: {
    title: "真机会",
    description: "可对冲，流动性和第二腿满足基础条件"
  },
  conditional: {
    title: "有条件",
    description: "借贷可得性、流动性或保证金风险仍需确认"
  },
  trap: {
    title: "陷阱",
    description: "费率极端但不可安全对冲，不应裸吃费率"
  }
};

export function OpportunityMiningScreen({
  onCalculate,
  onLiquidation,
  onPaperTrade
}: OpportunityMiningScreenProps) {
  const [threshold, setThreshold] = useState(0.003);
  const [limit, setLimit] = useState(50);
  const [includeTraps, setIncludeTraps] = useState(true);
  const [source, setSource] = useState<MiningSource>("fallback_snapshot");
  const [updatedAt, setUpdatedAt] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [opportunities, setOpportunities] = useState<MinedOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadMining = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    setErrorMessage(null);
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const response = await fetchMiningOpportunities({
        threshold,
        limit,
        includeTraps
      });
      setSource(response.source);
      setUpdatedAt(response.updatedAt);
      setErrors(response.errors);
      setOpportunities(response.data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "无法加载机会挖掘数据");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [includeTraps, limit, threshold]);

  useEffect(() => {
    void loadMining("initial");
  }, [loadMining]);

  const grouped = useMemo(() => ({
    true: opportunities.filter((item) => item.category === "true"),
    conditional: opportunities.filter((item) => item.category === "conditional"),
    trap: opportunities.filter((item) => item.category === "trap")
  }), [opportunities]);

  return (
    <main className="scanner-screen mining-screen">
      <section className="dashboard-hero mining-hero">
        <div>
          <span className="section-kicker">机会挖掘</span>
          <h2>机会挖掘 · Opportunity Mining</h2>
          <p>
            全市场扫描极端资金费率，并用可对冲性闸门区分真机会、有条件机会和陷阱。
          </p>
          <p>
            机会挖掘不同于标准教学。标准教学是在受控币池里理解资金费套利，机会挖掘则主动扫描全市场极端费率，并判断这些机会是否真的可以安全对冲。
          </p>
        </div>
      </section>

      <section className="mining-summary-grid">
        <Metric label="数据来源" value={sourceLabel(source)} />
        <Metric label="更新时间" value={updatedAt ? new Date(updatedAt).toLocaleString() : "等待中"} />
        <Metric label="总候选数" value={opportunities.length} />
        <Metric label="真机会" value={grouped.true.length} tone="true" />
        <Metric label="有条件" value={grouped.conditional.length} tone="conditional" />
        <Metric label="陷阱" value={grouped.trap.length} tone="trap" />
      </section>

      {source === "fallback_snapshot" ? (
        <div className="notice notice--mock">当前展示 FALLBACK，用于保证演示流程。真实行情读取链路已接入。</div>
      ) : null}
      {source === "partial" ? (
        <div className="notice notice--partial">
          <strong>部分交易所实时数据可用，部分交易所暂时超时。</strong>
          {Object.keys(errors).length > 0 ? (
            <ul>
              {Object.entries(errors).map(([exchange, message]) => (
                <li key={exchange}><span>{exchange}</span><p>{message}</p></li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      {source === "live" ? <div className="notice notice--live">全部交易所实时数据可用。</div> : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <MiningFilters
        includeTraps={includeTraps}
        isRefreshing={isRefreshing}
        limit={limit}
        threshold={threshold}
        onChange={(next) => {
          if (next.threshold !== undefined) setThreshold(next.threshold);
          if (next.limit !== undefined) setLimit(next.limit);
          if (next.includeTraps !== undefined) setIncludeTraps(next.includeTraps);
        }}
        onRefresh={() => void loadMining()}
      />

      {isLoading ? <div className="loading-state">正在加载机会挖掘数据...</div> : null}

      <section className="mining-category-grid">
        {(["true", "conditional", "trap"] as MiningCategory[]).map((category) => (
          <MiningCategoryCard
            category={category}
            count={grouped[category].length}
            description={CATEGORY_COPY[category].description}
            key={category}
            title={CATEGORY_COPY[category].title}
          >
            <MiningOpportunityTable
              category={category}
              onCalculate={onCalculate}
              onLiquidation={onLiquidation}
              onPaperTrade={onPaperTrade}
              opportunities={grouped[category]}
            />
          </MiningCategoryCard>
        ))}
      </section>
    </main>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: MiningCategory }) {
  return (
    <article className={"mining-metric-card " + (tone ? "mining-metric-card--" + tone : "")}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function sourceLabel(source: MiningSource): string {
  if (source === "fallback_snapshot") {
    return "FALLBACK";
  }

  return source === "live" ? "LIVE" : "PARTIAL";
}
