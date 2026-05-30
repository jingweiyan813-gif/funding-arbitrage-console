import type { ArbOpportunity, MinedOpportunity, MiningCategory } from "../types";
import { HedgeabilityBadge } from "./HedgeabilityBadge";

type MiningOpportunityTableProps = {
  opportunities: MinedOpportunity[];
  category: MiningCategory;
  onCalculate: (opportunity: ArbOpportunity) => void;
  onLiquidation: (opportunity: ArbOpportunity) => void;
  onPaperTrade: (opportunity: ArbOpportunity) => void;
};

export function MiningOpportunityTable({
  opportunities,
  category,
  onCalculate,
  onLiquidation,
  onPaperTrade
}: MiningOpportunityTableProps) {
  if (opportunities.length === 0) {
    return <div className="empty-state">当前分区暂无机会。</div>;
  }

  return (
    <div className="table-scroll mining-table-scroll">
      <table className="opportunity-table mining-table">
        <thead>
          <tr>
            <th>币种</th>
            <th>交易所</th>
            <th>原始费率</th>
            <th>结算周期</th>
            <th>日费率</th>
            <th>年化</th>
            <th>24h涨跌</th>
            <th>单边强度</th>
            <th>可对冲性</th>
            <th>策略类型</th>
            <th>原因</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((opportunity) => {
            const adapted = toArbOpportunity(opportunity);
            return (
              <tr
                className={category === "trap" ? "mining-row mining-row--trap" : "mining-row"}
                key={opportunity.symbol + "-" + opportunity.exchange + "-" + opportunity.rawRate}
              >
                <td className="symbol-cell">{opportunity.symbol}</td>
                <td>{opportunity.exchange}</td>
                <td>{formatPercent(opportunity.rawRate, 4)}</td>
                <td>
                  <span>{opportunity.intervalHours}h</span>
                  {opportunity.intervalShortened ? (
                    <span className="cycle-badge">周期压短</span>
                  ) : null}
                </td>
                <td className={opportunity.dailyRate < 0 ? "negative" : "positive"}>
                  {formatPercent(opportunity.dailyRate, 4)}
                </td>
                <td>{formatPercent(opportunity.annualizedRate, 2)}</td>
                <td>{opportunity.change24h === undefined ? "-" : formatPercent(opportunity.change24h, 2)}</td>
                <td>
                  <span className={"strength-badge strength-badge--" + opportunity.singleSidedStrength}>
                    {opportunity.singleSidedStrength}
                  </span>
                </td>
                <td><HedgeabilityBadge hedgeable={opportunity.hedgeability.hedgeable} /></td>
                <td>{formatStrategy(opportunity.strategyType)}</td>
                <td className="mining-reason-cell">
                  {category === "trap" ? <strong>为什么是陷阱？</strong> : null}
                  <span>{opportunity.reason}</span>
                  {category === "trap" ? (
                    <small>费率极端不代表能套利，缺少对冲腿时，裸吃费率等于裸赌方向。</small>
                  ) : null}
                </td>
                <td>
                  <div className="row-actions mining-actions">
                    <button onClick={() => onCalculate(adapted)} type="button">去计算</button>
                    <button onClick={() => onLiquidation(adapted)} type="button">看爆仓</button>
                    <button
                      disabled={category === "trap"}
                      onClick={() => onPaperTrade(adapted)}
                      title={category === "trap" ? "陷阱机会不可模拟建仓" : undefined}
                      type="button"
                    >
                      模拟建仓
                    </button>
                    {category === "trap" ? <small>陷阱机会不可模拟建仓</small> : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function toArbOpportunity(opportunity: MinedOpportunity): ArbOpportunity {
  const receiveSide = opportunity.rawRate >= 0 ? "short" : "long";
  const hedgeSide = receiveSide === "short" ? "long" : "short";

  return {
    symbol: opportunity.symbol,
    legA: {
      exchange: opportunity.exchange,
      rate: opportunity.rawRate,
      side: receiveSide
    },
    legB: {
      exchange: fallbackHedgeExchange(opportunity.exchange),
      rate: 0,
      side: hedgeSide
    },
    spread: Math.abs(opportunity.rawRate),
    netEdge: Math.abs(opportunity.rawRate),
    estApr: Math.abs(opportunity.annualizedRate),
    netApr: Math.abs(opportunity.annualizedRate),
    liquidity: opportunity.hedgeability.liquidityOk ? "mid" : "low",
    intervalHours: opportunity.intervalHours,
    fakeOpportunity: opportunity.category === "trap",
    direction: receiveSide + " " + opportunity.exchange + " / " + hedgeSide + " hedge leg",
    strategyType: opportunity.strategyType
  };
}

function fallbackHedgeExchange(exchange: MinedOpportunity["exchange"]): MinedOpportunity["exchange"] {
  if (exchange !== "binance") {
    return "binance";
  }

  return "bybit";
}

function formatPercent(value: number, digits: number): string {
  return (value * 100).toFixed(digits) + "%";
}

function formatStrategy(strategyType: MinedOpportunity["strategyType"]): string {
  return strategyType === "cross_exchange_perp" ? "跨所永续" : "现货-永续";
}
