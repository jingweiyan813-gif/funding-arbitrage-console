import type { FundingProfitResult } from "@funding-arbitrage-console/core";

type ProfitBillProps = {
  result: FundingProfitResult;
};

export function ProfitBill({ result }: ProfitBillProps) {
  return (
    <section className="bill-card">
      <div className="bill-heading">
        <h3>收益账单</h3>
        <p>净收益 = 毛资金费 - 开平仓手续费 - 滑点成本。</p>
      </div>
      <div className="bill-lines">
        <BillLine
          label="本周期 / 当前周期毛资金费收入"
          value={formatMoney(result.grossFunding)}
          tone={toneFor(result.grossFunding)}
        />
        <BillLine
          label="所A 收/付"
          value={formatMoney(result.legAFunding)}
          tone={toneFor(result.legAFunding)}
        />
        <BillLine
          label="所B 收/付"
          value={formatMoney(result.legBFunding)}
          tone={toneFor(result.legBFunding)}
        />
        <BillLine
          label="开仓手续费"
          value={formatMoney(result.openFees)}
          tone="cost"
        />
        <BillLine
          label="平仓手续费"
          value={formatMoney(result.closeFees)}
          tone="cost"
        />
        <BillLine
          label="总手续费"
          value={formatMoney(result.totalFees)}
          tone="cost"
        />
        <BillLine
          label="滑点成本"
          value={formatMoney(result.slippageCost)}
          tone="cost"
        />
        <BillLine
          emphasize
          label="净收益"
          value={formatMoney(result.netProfit)}
          tone={toneFor(result.netProfit)}
        />
        <BillLine
          label="回本周期"
          value={result.breakEvenCycles === null ? "不可回本" : `${result.breakEvenCycles}`}
        />
        <BillLine label="净年化" value={formatPercent(result.netApr, 2)} />
      </div>
      <p className="bill-note">手续费要付 4 次：两所各开各平。</p>
    </section>
  );
}

function BillLine({
  label,
  value,
  tone,
  emphasize = false
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "cost";
  emphasize?: boolean;
}) {
  return (
    <div className={emphasize ? "bill-line bill-line--emphasis" : "bill-line"}>
      <span>{label}</span>
      <strong className={tone ? `bill-value--${tone}` : ""}>{value}</strong>
    </div>
  );
}

function toneFor(value: number): "positive" | "negative" {
  return value >= 0 ? "positive" : "negative";
}

function formatMoney(value: number): string {
  return `${value >= 0 ? "+" : "-"}${Math.abs(value).toFixed(4)} USDT`;
}

function formatPercent(value: number, digits: number): string {
  return `${(value * 100).toFixed(digits)}%`;
}
