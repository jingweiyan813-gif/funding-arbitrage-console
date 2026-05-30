import type {
  LiquidationInput,
  LiquidationResult,
  RiskLevel,
  Side
} from "./types";

export function calculateLiquidationPrice(input: LiquidationInput): number {
  const { side, markPrice, leverage, margin, maintMarginRate } = input;

  if (markPrice <= 0) {
    throw new Error("markPrice must be greater than 0");
  }

  if (leverage <= 0) {
    throw new Error("leverage must be greater than 0");
  }

  if (margin <= 0) {
    throw new Error("margin must be greater than 0");
  }

  if (maintMarginRate < 0) {
    throw new Error("maintMarginRate must be greater than or equal to 0");
  }

  if (side === "long") {
    return markPrice * (1 - 1 / leverage + maintMarginRate);
  }

  return markPrice * (1 + 1 / leverage - maintMarginRate);
}

export function calculateSafetyBuffer(
  markPrice: number,
  liqPrice: number,
  side: Side
): number {
  if (side === "long") {
    return ((markPrice - liqPrice) / markPrice) * 100;
  }

  return ((liqPrice - markPrice) / markPrice) * 100;
}

export function getRiskLevel(
  distancePercent: number,
  leverage: number
): RiskLevel {
  if (distancePercent < 5) {
    return "critical";
  }

  if (distancePercent < 10) {
    return "warning";
  }

  if (leverage > 3) {
    return "warning";
  }

  return "safe";
}

export function calculateLiquidation(
  input: LiquidationInput
): LiquidationResult {
  const liqPrice = calculateLiquidationPrice(input);
  const distancePercent = calculateSafetyBuffer(
    input.markPrice,
    liqPrice,
    input.side
  );
  const riskLevel = getRiskLevel(distancePercent, input.leverage);
  const result: LiquidationResult = {
    liqPrice,
    distancePercent,
    riskLevel
  };

  if (input.leverage > 3) {
    result.warning = "杠杆超过 3x，建议降低杠杆或增加保证金缓冲。";
  }

  if (distancePercent < 5) {
    result.warning = "距离强平价过近，存在较高爆仓风险。";
  }

  return result;
}
