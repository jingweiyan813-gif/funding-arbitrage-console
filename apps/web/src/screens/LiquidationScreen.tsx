import { useMemo, useState } from "react";
import { calculateLiquidation } from "@funding-arbitrage-console/core";
import type { Side } from "@funding-arbitrage-console/core";
import { FormField } from "../components/FormField";
import { PriceAxis } from "../components/PriceAxis";
import type { LiquidationSeed } from "../types";

type LiquidationForm = {
  symbol: string;
  markPrice: number;
  legASide: Side;
  legALeverage: number;
  legAMargin: number;
  legAMaintMarginRate: number;
  legBSide: Side;
  legBLeverage: number;
  legBMargin: number;
  legBMaintMarginRate: number;
};

const defaultForm: LiquidationForm = {
  symbol: "BTC/USDT:USDT",
  markPrice: 50000,
  legASide: "short",
  legALeverage: 3,
  legAMargin: 500,
  legAMaintMarginRate: 0.005,
  legBSide: "long",
  legBLeverage: 3,
  legBMargin: 500,
  legBMaintMarginRate: 0.005
};

type LiquidationScreenProps = {
  seed?: LiquidationSeed | null;
};

export function LiquidationScreen({ seed }: LiquidationScreenProps) {
  const [form, setForm] = useState<LiquidationForm>(() =>
    seed ? formFromSeed(seed) : defaultForm
  );

  const legA = useMemo(
    () =>
      calculateLiquidation({
        side: form.legASide,
        markPrice: form.markPrice,
        leverage: form.legALeverage,
        margin: form.legAMargin,
        maintMarginRate: form.legAMaintMarginRate
      }),
    [form]
  );
  const legB = useMemo(
    () =>
      calculateLiquidation({
        side: form.legBSide,
        markPrice: form.markPrice,
        leverage: form.legBLeverage,
        margin: form.legBMargin,
        maintMarginRate: form.legBMaintMarginRate
      }),
    [form]
  );
  const overallWarning =
    legA.riskLevel === "critical" || legB.riskLevel === "critical"
      ? "存在强平距离过近的单腿风险。"
      : legA.warning ?? legB.warning ?? "当前参数下未触发额外风险提示。";

  function update<K extends keyof LiquidationForm>(
    key: K,
    value: LiquidationForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="scanner-screen">
      <section className="toolbar">
        <div>
          <span className="section-kicker">Liquidation Check</span>
          <h2>爆仓风险计算器</h2>
          <p className="section-copy">
            双腿看似中性，但每条腿都可能单独爆仓。
          </p>
        </div>
      </section>

      <section className="workbench-grid">
        <div className="form-card">
          <div className="form-grid">
            <FormField
              label="symbol"
              onChange={(value) => update("symbol", value)}
              value={form.symbol}
            />
            <FormField
              label="markPrice"
              onChange={(value) => update("markPrice", toNumber(value))}
              type="number"
              value={form.markPrice}
            />
            <SideSelect
              label="legA side"
              onChange={(value) => update("legASide", value)}
              value={form.legASide}
            />
            <FormField
              label="legA leverage"
              onChange={(value) => update("legALeverage", toNumber(value))}
              type="number"
              value={form.legALeverage}
            />
            <FormField
              label="legA margin"
              onChange={(value) => update("legAMargin", toNumber(value))}
              type="number"
              value={form.legAMargin}
            />
            <FormField
              label="legA maintMarginRate"
              onChange={(value) => update("legAMaintMarginRate", toNumber(value))}
              type="number"
              value={form.legAMaintMarginRate}
            />
            <SideSelect
              label="legB side"
              onChange={(value) => update("legBSide", value)}
              value={form.legBSide}
            />
            <FormField
              label="legB leverage"
              onChange={(value) => update("legBLeverage", toNumber(value))}
              type="number"
              value={form.legBLeverage}
            />
            <FormField
              label="legB margin"
              onChange={(value) => update("legBMargin", toNumber(value))}
              type="number"
              value={form.legBMargin}
            />
            <FormField
              label="legB maintMarginRate"
              onChange={(value) => update("legBMaintMarginRate", toNumber(value))}
              type="number"
              value={form.legBMaintMarginRate}
            />
          </div>
        </div>

        <section className="risk-result-card">
          <PriceAxis
            legs={[
              { label: "A", side: form.legASide, liqPrice: legA.liqPrice },
              { label: "B", side: form.legBSide, liqPrice: legB.liqPrice }
            ]}
            markPrice={form.markPrice}
          />
          <div className="risk-leg-grid">
            <RiskLegResult label="A 腿" result={legA} />
            <RiskLegResult label="B 腿" result={legB} />
          </div>
          <div className="notice notice--partial">
            <strong>整体风险提示</strong>
            <p>{overallWarning}</p>
            <p>双腿看似中性，但每条腿都可能单独爆仓。</p>
          </div>
        </section>
      </section>
    </main>
  );
}

function RiskLegResult({
  label,
  result
}: {
  label: string;
  result: ReturnType<typeof calculateLiquidation>;
}) {
  return (
    <article className={`risk-leg risk-leg--${result.riskLevel}`}>
      <span>{label}</span>
      <strong>强平价 {formatPrice(result.liqPrice)}</strong>
      <p>安全垫 {result.distancePercent.toFixed(2)}%</p>
      <p>风险等级 {result.riskLevel}</p>
      {result.warning ? <small>{result.warning}</small> : null}
    </article>
  );
}

function SideSelect({
  label,
  value,
  onChange
}: {
  label: string;
  value: Side;
  onChange: (value: Side) => void;
}) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <select
        onChange={(event) => onChange(event.currentTarget.value as Side)}
        value={value}
      >
        <option value="long">long</option>
        <option value="short">short</option>
      </select>
    </label>
  );
}

function formFromSeed(seed: LiquidationSeed): LiquidationForm {
  return {
    ...defaultForm,
    symbol: seed.symbol,
    markPrice: seed.markPrice,
    legASide: seed.legA.side,
    legBSide: seed.legB.side,
    legALeverage: seed.leverage,
    legBLeverage: seed.leverage,
    legAMargin: seed.margin,
    legBMargin: seed.margin,
    legAMaintMarginRate: seed.maintMarginRate,
    legBMaintMarginRate: seed.maintMarginRate
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}
