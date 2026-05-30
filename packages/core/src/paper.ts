import { calculateFundingAmount } from "./funding";
import type { PaperAccount, Side } from "./types";

export type OpenCostParams = {
  notional: number;
  feeRate: number;
  slippageBps: number;
};

export type OpenCostResult = {
  fee: number;
  slippageCost: number;
  totalCost: number;
};

export type CloseResultParams = {
  side: Side;
  entryPrice: number;
  exitPrice: number;
  notional: number;
  feeRate: number;
  slippageBps: number;
};

export type CloseResult = {
  pricePnl: number;
  fee: number;
  slippageCost: number;
  realizedPnl: number;
};

export type UnrealizedPnlParams = {
  side: Side;
  entryPrice: number;
  markPrice: number;
  notional: number;
};

export type FundingSettlementAmountParams = {
  side: Side;
  rate: number;
  notional: number;
};

export type LiquidationCheckParams = {
  side: Side;
  markPrice: number;
  liqPrice: number;
};

export type ApplyFundingToAccountParams = {
  account: PaperAccount;
  settlementAmount: number;
};

export type ApplyTradeToAccountParams = {
  account: PaperAccount;
  realizedPnl: number;
  fee: number;
};

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100000000) / 100000000;
}

function assertNonNegative(name: string, value: number): void {
  if (value < 0) {
    throw new Error(name + " must be greater than or equal to 0.");
  }
}

function assertPositive(name: string, value: number): void {
  if (value <= 0) {
    throw new Error(name + " must be greater than 0.");
  }
}

export function calculateOpenCost(params: OpenCostParams): OpenCostResult {
  const { notional, feeRate, slippageBps } = params;

  assertNonNegative("notional", notional);
  assertNonNegative("feeRate", feeRate);
  assertNonNegative("slippageBps", slippageBps);

  const fee = roundMoney(notional * feeRate);
  const slippageCost = roundMoney((notional * slippageBps) / 10000);
  const totalCost = roundMoney(fee + slippageCost);

  return { fee, slippageCost, totalCost };
}

export function calculateCloseResult(params: CloseResultParams): CloseResult {
  const { side, entryPrice, exitPrice, notional, feeRate, slippageBps } = params;

  assertPositive("entryPrice", entryPrice);
  assertPositive("exitPrice", exitPrice);
  assertNonNegative("notional", notional);
  assertNonNegative("feeRate", feeRate);
  assertNonNegative("slippageBps", slippageBps);

  const pricePnl =
    side === "long"
      ? (notional * (exitPrice - entryPrice)) / entryPrice
      : (notional * (entryPrice - exitPrice)) / entryPrice;
  const fee = notional * feeRate;
  const slippageCost = (notional * slippageBps) / 10000;
  const realizedPnl = pricePnl - fee - slippageCost;

  return {
    pricePnl: roundMoney(pricePnl),
    fee: roundMoney(fee),
    slippageCost: roundMoney(slippageCost),
    realizedPnl: roundMoney(realizedPnl)
  };
}

export function calculateUnrealizedPnl(params: UnrealizedPnlParams): number {
  const { side, entryPrice, markPrice, notional } = params;

  assertPositive("entryPrice", entryPrice);
  assertPositive("markPrice", markPrice);
  assertNonNegative("notional", notional);

  const pnl =
    side === "long"
      ? (notional * (markPrice - entryPrice)) / entryPrice
      : (notional * (entryPrice - markPrice)) / entryPrice;

  return roundMoney(pnl);
}

export function calculateFundingSettlementAmount(
  params: FundingSettlementAmountParams
): number {
  const { side, rate, notional } = params;

  assertNonNegative("notional", notional);

  return roundMoney(calculateFundingAmount(side, rate, notional));
}

export function shouldLiquidate(params: LiquidationCheckParams): boolean {
  const { side, markPrice, liqPrice } = params;

  assertPositive("markPrice", markPrice);
  assertPositive("liqPrice", liqPrice);

  return side === "long" ? markPrice <= liqPrice : markPrice >= liqPrice;
}

export function applyFundingToAccount(
  params: ApplyFundingToAccountParams
): PaperAccount {
  const { account, settlementAmount } = params;

  return {
    ...account,
    equity: roundMoney(account.equity + settlementAmount),
    totalFundingReceived: roundMoney(
      account.totalFundingReceived + settlementAmount
    )
  };
}

export function applyTradeToAccount(
  params: ApplyTradeToAccountParams
): PaperAccount {
  const { account, realizedPnl, fee } = params;

  assertNonNegative("fee", fee);

  return {
    ...account,
    equity: roundMoney(account.equity + realizedPnl),
    realizedPnl: roundMoney(account.realizedPnl + realizedPnl),
    totalFees: roundMoney(account.totalFees + fee)
  };
}
