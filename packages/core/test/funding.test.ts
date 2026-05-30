import { describe, expect, it } from "vitest";
import {
  calculateEstimatedApr,
  calculateFundingAmount,
  calculateFundingProfit,
  calculateNetEdge,
  calculateSpread
} from "../src";
import type { FundingLeg } from "../src";

const baseLeg = {
  exchange: "example",
  symbol: "BTC-USDT",
  notional: 1000,
  feeRate: 0.0002
} satisfies Omit<FundingLeg, "side" | "rate">;

describe("funding calculations", () => {
  it("calculates absolute spread", () => {
    expect(calculateSpread(0.0003, -0.0001)).toBeCloseTo(0.0004);
  });

  it("calculates net edge after fees", () => {
    expect(calculateNetEdge(0.0005, 0.0001, 0.0002)).toBeCloseTo(0.0002);
  });

  it("identifies false opportunities when net edge is not positive", () => {
    expect(calculateNetEdge(0.0002, 0.0001, 0.0001)).toBeLessThanOrEqual(0);
  });

  it("calculates estimated APR using interval hours", () => {
    expect(calculateEstimatedApr(0.0002, 4)).toBeCloseTo(
      0.0002 * (24 / 4) * 365
    );
  });

  it("treats positive funding as long pays and short receives", () => {
    expect(calculateFundingAmount("long", 0.0001, 1000)).toBeCloseTo(-0.1);
    expect(calculateFundingAmount("short", 0.0001, 1000)).toBeCloseTo(0.1);
  });

  it("treats negative funding as long receives and short pays", () => {
    expect(calculateFundingAmount("long", -0.0001, 1000)).toBeCloseTo(0.1);
    expect(calculateFundingAmount("short", -0.0001, 1000)).toBeCloseTo(-0.1);
  });

  it("calculates funding profit for one positive and one negative rate", () => {
    const result = calculateFundingProfit({
      legA: { ...baseLeg, side: "short", rate: 0.0003 },
      legB: { ...baseLeg, side: "long", rate: -0.0001 },
      cycles: 3,
      intervalHours: 8,
      slippageBps: 2
    });

    expect(result.legAFunding).toBeCloseTo(0.9);
    expect(result.legBFunding).toBeCloseTo(0.3);
    expect(result.grossFunding).toBeCloseTo(1.2);
  });

  it("calculates funding profit for two positive rates", () => {
    const result = calculateFundingProfit({
      legA: { ...baseLeg, side: "long", rate: 0.0003 },
      legB: { ...baseLeg, side: "short", rate: 0.0001 },
      cycles: 1,
      intervalHours: 8,
      slippageBps: 0
    });

    expect(result.grossFunding).toBeCloseTo(-0.2);
    expect(result.breakEvenCycles).toBeNull();
  });

  it("calculates funding profit for two negative rates", () => {
    const result = calculateFundingProfit({
      legA: { ...baseLeg, side: "long", rate: -0.0003 },
      legB: { ...baseLeg, side: "short", rate: -0.0001 },
      cycles: 1,
      intervalHours: 8,
      slippageBps: 0
    });

    expect(result.grossFunding).toBeCloseTo(0.2);
  });

  it("includes open and close fees", () => {
    const result = calculateFundingProfit({
      legA: { ...baseLeg, side: "short", rate: 0.0003 },
      legB: { ...baseLeg, side: "long", rate: -0.0001 },
      cycles: 1,
      intervalHours: 8,
      slippageBps: 0
    });

    expect(result.openFees).toBeCloseTo(0.4);
    expect(result.closeFees).toBeCloseTo(0.4);
    expect(result.totalFees).toBeCloseTo(0.8);
  });

  it("counts slippage for open and close", () => {
    const result = calculateFundingProfit({
      legA: { ...baseLeg, side: "short", rate: 0.0003 },
      legB: { ...baseLeg, side: "long", rate: -0.0001 },
      cycles: 1,
      intervalHours: 8,
      slippageBps: 5
    });

    expect(result.slippageCost).toBeCloseTo(2);
  });

  it("calculates net profit from gross funding, fees, and slippage", () => {
    const result = calculateFundingProfit({
      legA: { ...baseLeg, side: "short", rate: 0.0003 },
      legB: { ...baseLeg, side: "long", rate: -0.0001 },
      cycles: 2,
      intervalHours: 4,
      slippageBps: 1
    });

    expect(result.netProfit).toBeCloseTo(
      result.grossFunding - result.totalFees - result.slippageCost
    );
    expect(result.netApr).toBeCloseTo(
      (result.netProfit / 1000) * (24 / 4) * 365 * (1 / 2)
    );
  });
});
