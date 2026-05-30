import { useMemo, useState } from "react";
import { calculateFundingProfit } from "@funding-arbitrage-console/core";
import type { Side } from "@funding-arbitrage-console/core";
import { FormField } from "../components/FormField";
import { ProfitBill } from "../components/ProfitBill";
import { Tooltip } from "../components/Tooltip";
import { EducationPanel } from "../edu/EducationPanel";
import { calculatorEducation } from "../edu/copy";
import type { CalculatorSeed } from "../types";

type FeeMode = "maker" | "taker";

type CalculatorForm = {
  symbol: string;
  legAExchange: string;
  legASide: Side;
  legARate: number;
  legBExchange: string;
  legBSide: Side;
  legBRate: number;
  notional: number;
  cycles: number;
  intervalHours: number;
  feeMode: FeeMode;
  feeRateA: number;
  feeRateB: number;
  slippageBps: number;
};

const makerFee = 0.0002;
const takerFee = 0.0006;

const defaultForm: CalculatorForm = {
  symbol: "BTC/USDT:USDT",
  legAExchange: "binance",
  legASide: "short",
  legARate: 0.0003,
  legBExchange: "bybit",
  legBSide: "long",
  legBRate: -0.0001,
  notional: 1000,
  cycles: 1,
  intervalHours: 8,
  feeMode: "taker",
  feeRateA: takerFee,
  feeRateB: takerFee,
  slippageBps: 5
};

type CalculatorScreenProps = {
  seed?: CalculatorSeed | null;
};

export function CalculatorScreen({ seed }: CalculatorScreenProps) {
  const [form, setForm] = useState<CalculatorForm>(() =>
    seed ? formFromSeed(seed) : defaultForm
  );

  const validationError = validateForm(form);
  const result = useMemo(() => {
    if (validationError) {
      return null;
    }

    try {
      return calculateFundingProfit({
        legA: {
          exchange: form.legAExchange,
          symbol: form.symbol,
          side: form.legASide,
          rate: form.legARate,
          notional: form.notional,
          feeRate: form.feeRateA
        },
        legB: {
          exchange: form.legBExchange,
          symbol: form.symbol,
          side: form.legBSide,
          rate: form.legBRate,
          notional: form.notional,
          feeRate: form.feeRateB
        },
        cycles: form.cycles,
        intervalHours: form.intervalHours,
        slippageBps: form.slippageBps
      });
    } catch {
      return null;
    }
  }, [form, validationError]);

  function update<K extends keyof CalculatorForm>(
    key: K,
    value: CalculatorForm[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFeeMode(feeMode: FeeMode) {
    const feeRate = feeMode === "maker" ? makerFee : takerFee;
    setForm((current) => ({
      ...current,
      feeMode,
      feeRateA: feeRate,
      feeRateB: feeRate
    }));
  }

  return (
    <main className="scanner-screen">
      <section className="toolbar">
        <div>
          <span className="section-kicker">Profit Calculator</span>
          <h2>净收益计算器</h2>
          <p className="section-copy">
            使用 core 计算层估算跨所资金费收入、开平仓手续费、
            <Tooltip
              label="滑点"
              text="实际成交价格和预期价格之间的偏差，会直接降低净收益。"
            />
            成本和净年化。
          </p>
        </div>
      </section>

      <EducationPanel defaultCollapsed={false} title={calculatorEducation.title}>
        <ul>
          {calculatorEducation.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </EducationPanel>

      <section className="workbench-grid">
        <div className="form-card">
          <div className="form-grid">
            <FormField
              label="symbol"
              onChange={(value) => update("symbol", value)}
              value={form.symbol}
            />
            <FormField
              label="notional"
              onChange={(value) => update("notional", toNumber(value))}
              type="number"
              value={form.notional}
            />
            <FormField
              label="cycles"
              onChange={(value) => update("cycles", toNumber(value))}
              type="number"
              value={form.cycles}
            />
            <FormField
              label="intervalHours"
              onChange={(value) => update("intervalHours", toNumber(value))}
              type="number"
              value={form.intervalHours}
            />
            <FormField
              label="legA exchange"
              onChange={(value) => update("legAExchange", value)}
              value={form.legAExchange}
            />
            <SideSelect
              label="legA side"
              onChange={(value) => update("legASide", value)}
              value={form.legASide}
            />
            <FormField
              label="legA rate"
              onChange={(value) => update("legARate", toNumber(value))}
              type="number"
              value={form.legARate}
            />
            <FormField
              label="feeRateA"
              onChange={(value) => update("feeRateA", toNumber(value))}
              type="number"
              value={form.feeRateA}
            />
            <FormField
              label="legB exchange"
              onChange={(value) => update("legBExchange", value)}
              value={form.legBExchange}
            />
            <SideSelect
              label="legB side"
              onChange={(value) => update("legBSide", value)}
              value={form.legBSide}
            />
            <FormField
              label="legB rate"
              onChange={(value) => update("legBRate", toNumber(value))}
              type="number"
              value={form.legBRate}
            />
            <FormField
              label="feeRateB"
              onChange={(value) => update("feeRateB", toNumber(value))}
              type="number"
              value={form.feeRateB}
            />
            <label className="form-field">
              <span>feeMode</span>
              <select
                onChange={(event) =>
                  updateFeeMode(event.currentTarget.value as FeeMode)
                }
                value={form.feeMode}
              >
                <option value="maker">maker</option>
                <option value="taker">taker</option>
              </select>
              <small>maker: 0.0002 / taker: 0.0006</small>
            </label>
            <FormField
              hint="按开仓和平仓各计算一次"
              label="slippageBps"
              onChange={(value) => update("slippageBps", toNumber(value))}
              type="number"
              value={form.slippageBps}
            />
          </div>
        </div>
        {validationError || !result ? (
          <div className="error-banner calculator-error">
            {validationError ?? "当前输入无法完成计算，请检查参数。"}
          </div>
        ) : (
          <ProfitBill result={result} />
        )}
      </section>
    </main>
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

function formFromSeed(seed: CalculatorSeed): CalculatorForm {
  return {
    ...defaultForm,
    symbol: seed.symbol,
    legAExchange: seed.legA.exchange,
    legASide: seed.legA.side,
    legARate: seed.legA.rate,
    legBExchange: seed.legB.exchange,
    legBSide: seed.legB.side,
    legBRate: seed.legB.rate,
    notional: seed.notional,
    cycles: seed.cycles,
    intervalHours: seed.intervalHours,
    slippageBps: seed.slippageBps
  };
}

function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateForm(form: CalculatorForm): string | null {
  if (!form.symbol.trim()) {
    return "symbol 不能为空。";
  }

  if (form.notional < 0) {
    return "notional 不能为负数。";
  }

  if (form.cycles <= 0) {
    return "cycles 必须大于 0。";
  }

  if (form.intervalHours <= 0) {
    return "intervalHours 必须大于 0。";
  }

  if (form.feeRateA < 0 || form.feeRateB < 0 || form.slippageBps < 0) {
    return "手续费和滑点不能为负数。";
  }

  return null;
}
