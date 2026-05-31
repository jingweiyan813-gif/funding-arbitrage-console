import { useMemo, useState } from "react";
import { calculateLiquidation } from "@funding-arbitrage-console/core";
import type { Side } from "@funding-arbitrage-console/core";
import { FormField } from "../components/FormField";
import { PriceAxis } from "../components/PriceAxis";
import { Tooltip } from "../components/Tooltip";
import { EducationPanel } from "../edu/EducationPanel";
import { liquidationEducation } from "../edu/copy";
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

  const validationError = validateForm(form);
  const liquidationResult = useMemo(() => {
    if (validationError) {
      return null;
    }

    try {
      const legA = calculateLiquidation({
        side: form.legASide,
        markPrice: form.markPrice,
        leverage: form.legALeverage,
        margin: form.legAMargin,
        maintMarginRate: form.legAMaintMarginRate
      });
      const legB = calculateLiquidation({
        side: form.legBSide,
        markPrice: form.markPrice,
        leverage: form.legBLeverage,
        margin: form.legBMargin,
        maintMarginRate: form.legBMaintMarginRate
      });
      const overallWarning =
        legA.riskLevel === "critical" || legB.riskLevel === "critical"
          ? "存在强平距离过近的单腿风险。"
          : legA.warning ?? legB.warning ?? "当前参数下未触发额外风险提示。";

      return { legA, legB, overallWarning };
    } catch {
      return null;
    }
  }, [form, validationError]);

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
          <span className="section-kicker">爆仓风险</span>
          <h2>爆仓风险 · Liquidation</h2>
          <p className="section-copy">
            双腿
            <Tooltip
              label="Delta 中性"
              text="多空方向相互抵消价格方向风险的状态，但不代表没有保证金或强平风险。"
            />
            不代表没有风险，每条腿都可能单独触及
            <Tooltip
              label="强平价"
              text="保证金不足时仓位可能被交易所强制平仓的价格。"
            />
            。
          </p>
        </div>
      </section>

      <EducationPanel defaultCollapsed={false} title={liquidationEducation.title}>
        <ul>
          {liquidationEducation.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
        <p>
          <Tooltip
            label="维持保证金"
            text="持仓必须维持的最低保证金比例，低于要求时可能触发强平。"
          />
          是强平价估算中的关键参数。
        </p>
      </EducationPanel>

      <section className="workbench-grid">
        <div className="form-card">
          <div className="form-grid">
            <FormField
              label="币种"
              onChange={(value) => update("symbol", value)}
              value={form.symbol}
            />
            <FormField
              label="标记价格"
              onChange={(value) => update("markPrice", toNumber(value))}
              type="number"
              value={form.markPrice}
            />
            <SideSelect
              label="A 腿方向"
              onChange={(value) => update("legASide", value)}
              value={form.legASide}
            />
            <FormField
              label="A 腿杠杆"
              onChange={(value) => update("legALeverage", toNumber(value))}
              type="number"
              value={form.legALeverage}
            />
            <FormField
              label="A 腿保证金"
              onChange={(value) => update("legAMargin", toNumber(value))}
              type="number"
              value={form.legAMargin}
            />
            <FormField
              label="A 腿维持保证金率"
              onChange={(value) => update("legAMaintMarginRate", toNumber(value))}
              type="number"
              value={form.legAMaintMarginRate}
            />
            <SideSelect
              label="B 腿方向"
              onChange={(value) => update("legBSide", value)}
              value={form.legBSide}
            />
            <FormField
              label="B 腿杠杆"
              onChange={(value) => update("legBLeverage", toNumber(value))}
              type="number"
              value={form.legBLeverage}
            />
            <FormField
              label="B 腿保证金"
              onChange={(value) => update("legBMargin", toNumber(value))}
              type="number"
              value={form.legBMargin}
            />
            <FormField
              label="B 腿维持保证金率"
              onChange={(value) => update("legBMaintMarginRate", toNumber(value))}
              type="number"
              value={form.legBMaintMarginRate}
            />
          </div>
        </div>

        <section className="risk-result-card">
          {validationError || !liquidationResult ? (
            <div className="error-banner">
              {validationError ?? "当前输入无法完成强平计算，请检查参数。"}
            </div>
          ) : (
            <>
              <PriceAxis
                legs={[
                  {
                    label: "A",
                    side: form.legASide,
                    liqPrice: liquidationResult.legA.liqPrice
                  },
                  {
                    label: "B",
                    side: form.legBSide,
                    liqPrice: liquidationResult.legB.liqPrice
                  }
                ]}
                markPrice={form.markPrice}
              />
              <div className="risk-leg-grid">
                <RiskLegResult label="A 腿" result={liquidationResult.legA} />
                <RiskLegResult label="B 腿" result={liquidationResult.legB} />
              </div>
              <div className="notice notice--partial">
                <strong>整体风险提示</strong>
                <p>{liquidationResult.overallWarning}</p>
                <p>双腿看似中性，但每条腿都可能单独爆仓。</p>
              </div>
            </>
          )}
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
        <option value="long">多头 long</option>
        <option value="short">空头 short</option>
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

function validateForm(form: LiquidationForm): string | null {
  if (!form.symbol.trim()) {
    return "币种不能为空。";
  }

  if (form.markPrice <= 0) {
    return "标记价格必须大于 0。";
  }

  if (form.legALeverage <= 0 || form.legBLeverage <= 0) {
    return "杠杆必须大于 0。";
  }

  if (form.legAMargin <= 0 || form.legBMargin <= 0) {
    return "保证金必须大于 0。";
  }

  if (form.legAMaintMarginRate < 0 || form.legBMaintMarginRate < 0) {
    return "维持保证金率不能为负数。";
  }

  return null;
}

function formatPrice(value: number): string {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
}
