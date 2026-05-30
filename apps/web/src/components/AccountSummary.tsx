import type { PaperAccount } from "../types";

type AccountSummaryProps = {
  account: PaperAccount | null;
};

export function AccountSummary({ account }: AccountSummaryProps) {
  if (!account) {
    return <div className="loading-state">正在加载虚拟账户...</div>;
  }

  return (
    <section className="account-summary-grid">
      <AccountMetric label="总权益" value={formatMoney(account.equity)} suffix={account.baseCurrency} />
      <AccountMetric label="已实现盈亏" tone={account.realizedPnl} value={formatMoney(account.realizedPnl)} />
      <AccountMetric label="累计资金费" tone={account.totalFundingReceived} value={formatMoney(account.totalFundingReceived)} />
      <AccountMetric label="累计手续费" tone={-account.totalFees} value={formatMoney(account.totalFees)} />
      <AccountMetric label="基准币种" value={account.baseCurrency} />
    </section>
  );
}

function AccountMetric({
  label,
  value,
  suffix,
  tone
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: number;
}) {
  const toneClass = tone === undefined ? "" : tone >= 0 ? "positive" : "negative";

  return (
    <article className="account-metric-card">
      <span>{label}</span>
      <strong className={toneClass}>{value}</strong>
      {suffix ? <small>{suffix}</small> : null}
    </article>
  );
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: 2
  });
}
