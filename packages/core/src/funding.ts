import type { FundingProfitInput, FundingProfitResult, Side } from "./types.js";

export function calculateSpread(rateA: number, rateB: number): number {
  return Math.abs(rateA - rateB);
}

export function calculateNetEdge(
  spread: number,
  feeA: number,
  feeB: number
): number {
  return spread - feeA - feeB;
}

export function calculateEstimatedApr(
  edge: number,
  intervalHours: number
): number {
  return edge * (24 / intervalHours) * 365;
}

export function calculateFundingAmount(
  side: Side,
  rate: number,
  notional: number
): number {
  const amount = Math.abs(rate) * notional;

  if (rate === 0) {
    return 0;
  }

  if (side === "long") {
    return rate > 0 ? -amount : amount;
  }

  return rate > 0 ? amount : -amount;
}

export function calculateFundingProfit(
  input: FundingProfitInput
): FundingProfitResult {
  const { legA, legB, cycles, intervalHours, slippageBps } = input;

  const singleCycleLegAFunding = calculateFundingAmount(
    legA.side,
    legA.rate,
    legA.notional
  );
  const singleCycleLegBFunding = calculateFundingAmount(
    legB.side,
    legB.rate,
    legB.notional
  );
  const singleCycleGrossFunding =
    singleCycleLegAFunding + singleCycleLegBFunding;

  const legAFunding = singleCycleLegAFunding * cycles;
  const legBFunding = singleCycleLegBFunding * cycles;
  const grossFunding = legAFunding + legBFunding;
  const openFees =
    legA.notional * legA.feeRate + legB.notional * legB.feeRate;
  const closeFees = openFees;
  const totalFees = openFees + closeFees;
  const slippageCost =
    (legA.notional + legB.notional) * (slippageBps / 10000) * 2;
  const netProfit = grossFunding - totalFees - slippageCost;
  const breakEvenCycles =
    singleCycleGrossFunding > 0
      ? Math.ceil((totalFees + slippageCost) / singleCycleGrossFunding)
      : null;
  const netApr =
    (netProfit / ((legA.notional + legB.notional) / 2)) *
    (24 / intervalHours) *
    365 *
    (1 / cycles);

  return {
    grossFunding,
    legAFunding,
    legBFunding,
    openFees,
    closeFees,
    totalFees,
    slippageCost,
    netProfit,
    breakEvenCycles,
    netApr
  };
}
