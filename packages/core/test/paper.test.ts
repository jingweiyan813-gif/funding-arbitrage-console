import { describe, expect, it } from "vitest";
import {
  applyFundingToAccount,
  applyTradeToAccount,
  calculateCloseResult,
  calculateFundingSettlementAmount,
  calculateOpenCost,
  calculateUnrealizedPnl,
  roundMoney,
  shouldLiquidate
} from "../src";
import type { PaperAccount } from "../src";

const baseAccount: PaperAccount = {
  id: "account-1",
  equity: 1000,
  baseCurrency: "USDT",
  realizedPnl: 0,
  totalFundingReceived: 0,
  totalFees: 0
};

describe("paper trading calculations", () => {
  it("rounds money to 8 decimal places", () => {
    expect(roundMoney(1.123456789)).toBe(1.12345679);
    expect(roundMoney(1.123456784)).toBe(1.12345678);
  });

  it("calculates open fees and slippage", () => {
    const result = calculateOpenCost({
      notional: 1000,
      feeRate: 0.0006,
      slippageBps: 5
    });

    expect(result.fee).toBeCloseTo(0.6);
    expect(result.slippageCost).toBeCloseTo(0.5);
    expect(result.totalCost).toBeCloseTo(1.1);
  });

  it("calculates profitable long close", () => {
    const result = calculateCloseResult({
      side: "long",
      entryPrice: 100,
      exitPrice: 110,
      notional: 1000,
      feeRate: 0.0006,
      slippageBps: 5
    });

    expect(result.pricePnl).toBeCloseTo(100);
    expect(result.realizedPnl).toBeCloseTo(98.9);
  });

  it("calculates losing long close", () => {
    const result = calculateCloseResult({
      side: "long",
      entryPrice: 100,
      exitPrice: 90,
      notional: 1000,
      feeRate: 0.0006,
      slippageBps: 5
    });

    expect(result.pricePnl).toBeCloseTo(-100);
    expect(result.realizedPnl).toBeCloseTo(-101.1);
  });

  it("calculates profitable short close", () => {
    const result = calculateCloseResult({
      side: "short",
      entryPrice: 100,
      exitPrice: 90,
      notional: 1000,
      feeRate: 0.0006,
      slippageBps: 5
    });

    expect(result.pricePnl).toBeCloseTo(100);
    expect(result.realizedPnl).toBeCloseTo(98.9);
  });

  it("calculates losing short close", () => {
    const result = calculateCloseResult({
      side: "short",
      entryPrice: 100,
      exitPrice: 110,
      notional: 1000,
      feeRate: 0.0006,
      slippageBps: 5
    });

    expect(result.pricePnl).toBeCloseTo(-100);
    expect(result.realizedPnl).toBeCloseTo(-101.1);
  });

  it("calculates long unrealized profit", () => {
    expect(
      calculateUnrealizedPnl({
        side: "long",
        entryPrice: 100,
        markPrice: 112,
        notional: 1000
      })
    ).toBeCloseTo(120);
  });

  it("calculates short unrealized profit", () => {
    expect(
      calculateUnrealizedPnl({
        side: "short",
        entryPrice: 100,
        markPrice: 88,
        notional: 1000
      })
    ).toBeCloseTo(120);
  });

  it("settles positive funding as long pays and short receives", () => {
    expect(
      calculateFundingSettlementAmount({
        side: "long",
        rate: 0.0001,
        notional: 1000
      })
    ).toBeCloseTo(-0.1);
    expect(
      calculateFundingSettlementAmount({
        side: "short",
        rate: 0.0001,
        notional: 1000
      })
    ).toBeCloseTo(0.1);
  });

  it("settles negative funding as long receives and short pays", () => {
    expect(
      calculateFundingSettlementAmount({
        side: "long",
        rate: -0.0001,
        notional: 1000
      })
    ).toBeCloseTo(0.1);
    expect(
      calculateFundingSettlementAmount({
        side: "short",
        rate: -0.0001,
        notional: 1000
      })
    ).toBeCloseTo(-0.1);
  });

  it("detects long liquidation", () => {
    expect(
      shouldLiquidate({ side: "long", markPrice: 90, liqPrice: 90 })
    ).toBe(true);
    expect(
      shouldLiquidate({ side: "long", markPrice: 91, liqPrice: 90 })
    ).toBe(false);
  });

  it("detects short liquidation", () => {
    expect(
      shouldLiquidate({ side: "short", markPrice: 110, liqPrice: 110 })
    ).toBe(true);
    expect(
      shouldLiquidate({ side: "short", markPrice: 109, liqPrice: 110 })
    ).toBe(false);
  });

  it("applies funding without mutating the original account", () => {
    const next = applyFundingToAccount({
      account: baseAccount,
      settlementAmount: 2.5
    });

    expect(next).not.toBe(baseAccount);
    expect(baseAccount.equity).toBe(1000);
    expect(baseAccount.totalFundingReceived).toBe(0);
    expect(next.equity).toBeCloseTo(1002.5);
    expect(next.totalFundingReceived).toBeCloseTo(2.5);
  });

  it("applies trade result without mutating the original account", () => {
    const next = applyTradeToAccount({
      account: baseAccount,
      realizedPnl: 98.9,
      fee: 0.6
    });

    expect(next).not.toBe(baseAccount);
    expect(baseAccount.equity).toBe(1000);
    expect(baseAccount.realizedPnl).toBe(0);
    expect(baseAccount.totalFees).toBe(0);
    expect(next.equity).toBeCloseTo(1098.9);
    expect(next.realizedPnl).toBeCloseTo(98.9);
    expect(next.totalFees).toBeCloseTo(0.6);
  });

  it("does not deduct slippage again when applying a trade", () => {
    const closeResult = calculateCloseResult({
      side: "long",
      entryPrice: 100,
      exitPrice: 110,
      notional: 1000,
      feeRate: 0.0006,
      slippageBps: 5
    });
    const next = applyTradeToAccount({
      account: baseAccount,
      realizedPnl: closeResult.realizedPnl,
      fee: closeResult.fee
    });

    expect(next.equity).toBeCloseTo(1000 + closeResult.realizedPnl);
    expect(next.equity).not.toBeCloseTo(
      1000 + closeResult.realizedPnl - closeResult.slippageCost
    );
  });

  it("throws on invalid numeric inputs", () => {
    expect(() =>
      calculateOpenCost({ notional: -1, feeRate: 0, slippageBps: 0 })
    ).toThrow(Error);
    expect(() =>
      calculateCloseResult({
        side: "long",
        entryPrice: 0,
        exitPrice: 100,
        notional: 1000,
        feeRate: 0,
        slippageBps: 0
      })
    ).toThrow(Error);
    expect(() =>
      calculateUnrealizedPnl({
        side: "long",
        entryPrice: 100,
        markPrice: 0,
        notional: 1000
      })
    ).toThrow(Error);
    expect(() =>
      shouldLiquidate({ side: "long", markPrice: 100, liqPrice: 0 })
    ).toThrow(Error);
  });
});
