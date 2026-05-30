import { describe, expect, it } from "vitest";
import {
  buildDiscoveryCandidate,
  calculateCashCarryNetReturn,
  classifySingleSidedStrength,
  getTrendDirection,
  isExtremeFundingRate,
  isIntervalShortened,
  judgeHedgeability,
  normalizeFundingRate
} from "../src";

describe("opportunity mining calculations", () => {
  it("normalizes 8h funding rate to daily rate", () => {
    const result = normalizeFundingRate(0.001, 8);

    expect(result.dailyRate).toBeCloseTo(0.003);
    expect(result.annualizedRate).toBeCloseTo(1.095);
  });

  it("normalizes 2h funding rate to be comparable with 8h rates", () => {
    const twoHour = normalizeFundingRate(0.00025, 2);
    const eightHour = normalizeFundingRate(0.001, 8);

    expect(twoHour.dailyRate).toBeCloseTo(eightHour.dailyRate);
    expect(twoHour.annualizedRate).toBeCloseTo(eightHour.annualizedRate);
  });

  it("throws when intervalHours is not positive", () => {
    expect(() => normalizeFundingRate(0.001, 0)).toThrow(Error);
    expect(() => normalizeFundingRate(0.001, -1)).toThrow(Error);
  });

  it("detects extreme funding rate with default threshold", () => {
    expect(isExtremeFundingRate(0.003)).toBe(true);
    expect(isExtremeFundingRate(-0.0031)).toBe(true);
    expect(isExtremeFundingRate(0.0029)).toBe(false);
  });

  it("maps positive funding to long crowded trend", () => {
    expect(getTrendDirection(0.0001)).toBe("long_crowded");
    expect(getTrendDirection(0)).toBe("long_crowded");
  });

  it("maps negative funding to short crowded trend", () => {
    expect(getTrendDirection(-0.0001)).toBe("short_crowded");
  });

  it("detects shortened settlement intervals", () => {
    expect(isIntervalShortened(2)).toBe(true);
    expect(isIntervalShortened(8)).toBe(false);
  });

  it("classifies severe single-sided strength", () => {
    expect(
      classifySingleSidedStrength({
        change24h: 0.5,
        dailyRate: 0.001,
        intervalShortened: false
      })
    ).toBe("severe");
    expect(
      classifySingleSidedStrength({
        dailyRate: 0.005,
        intervalShortened: true
      })
    ).toBe("severe");
  });

  it("classifies clear single-sided strength", () => {
    expect(
      classifySingleSidedStrength({
        change24h: 0.25,
        dailyRate: 0.001,
        intervalShortened: false
      })
    ).toBe("clear");
    expect(
      classifySingleSidedStrength({
        dailyRate: 0.001,
        intervalShortened: true
      })
    ).toBe("clear");
  });

  it("builds discovery candidate with complete fields", () => {
    const candidate = buildDiscoveryCandidate({
      symbol: "BTC/USDT:USDT",
      exchange: "binance",
      rawRate: 0.001,
      intervalHours: 8,
      change24h: 0.21,
      change7d: 0.33
    });

    expect(candidate).toEqual({
      symbol: "BTC/USDT:USDT",
      exchange: "binance",
      rawRate: 0.001,
      intervalHours: 8,
      dailyRate: 0.003,
      annualizedRate: 1.095,
      change24h: 0.21,
      change7d: 0.33,
      intervalShortened: false,
      trendDirection: "long_crowded",
      singleSidedStrength: "clear"
    });
  });

  it("marks missing second leg as hedgeable false", () => {
    const verdict = judgeHedgeability({
      secondLegExists: false,
      liquidityOk: true
    });

    expect(verdict.hedgeable).toBe("false");
    expect(verdict.reason).toContain("缺少第二条可对冲腿");
  });

  it("marks insufficient liquidity as hedgeable false", () => {
    const verdict = judgeHedgeability({
      secondLegExists: true,
      liquidityOk: false
    });

    expect(verdict.hedgeable).toBe("false");
    expect(verdict.reason).toContain("流动性不足");
  });

  it("marks unavailable spot borrow as hedgeable false", () => {
    const verdict = judgeHedgeability({
      secondLegExists: true,
      liquidityOk: true,
      spotBorrowAvailable: false
    });

    expect(verdict.hedgeable).toBe("false");
    expect(verdict.reason).toContain("现货借币不可得");
  });

  it("marks high spot borrow rate as conditional", () => {
    const verdict = judgeHedgeability({
      secondLegExists: true,
      liquidityOk: true,
      spotBorrowAvailable: true,
      spotBorrowRate: 0.0011
    });

    expect(verdict.hedgeable).toBe("conditional");
    expect(verdict.spotBorrow.rate).toBe(0.0011);
    expect(verdict.reason).toContain("借币利率较高");
  });

  it("marks unknown spot borrow availability as conditional", () => {
    const verdict = judgeHedgeability({
      secondLegExists: true,
      liquidityOk: true
    });

    expect(verdict.hedgeable).toBe("conditional");
    expect(verdict.spotBorrow.available).toBe("unknown");
    expect(verdict.reason).toContain("借贷可得性暂不可确认");
  });

  it("marks high margin asset risk as conditional", () => {
    const verdict = judgeHedgeability({
      secondLegExists: true,
      liquidityOk: true,
      spotBorrowAvailable: true,
      marginAssetRisk: "high"
    });

    expect(verdict.hedgeable).toBe("conditional");
    expect(verdict.marginAssetRisk).toBe("high");
    expect(verdict.reason).toContain("保证金资产风险较高");
  });

  it("marks good conditions as hedgeable true", () => {
    const verdict = judgeHedgeability({
      secondLegExists: true,
      liquidityOk: true,
      spotBorrowAvailable: true,
      spotBorrowRate: 0.0005,
      depthUsd: 1000000,
      marginAssetRisk: "low"
    });

    expect(verdict.hedgeable).toBe("true");
    expect(verdict.depthUsd).toBe(1000000);
    expect(verdict.reason).toContain("存在可对冲腿");
  });

  it("calculates cash-and-carry net return including borrow cost", () => {
    const result = calculateCashCarryNetReturn({
      notional: 1000,
      fundingRate: 0.001,
      intervalHours: 8,
      cycles: 3,
      basisPnl: 2,
      openFeeRate: 0.0006,
      closeFeeRate: 0.0006,
      slippageBps: 5,
      borrowRatePerDay: 0.0002,
      holdingDays: 1
    });

    expect(result.grossFunding).toBeCloseTo(3);
    expect(result.basisPnl).toBeCloseTo(2);
    expect(result.openFees).toBeCloseTo(1.2);
    expect(result.closeFees).toBeCloseTo(1.2);
    expect(result.slippageCost).toBeCloseTo(2);
    expect(result.borrowCost).toBeCloseTo(0.2);
    expect(result.netProfit).toBeCloseTo(0.4);
    expect(result.netApr).toBeCloseTo(0.146);
  });

  it("throws when cash-and-carry holdingDays is not positive", () => {
    expect(() =>
      calculateCashCarryNetReturn({
        notional: 1000,
        fundingRate: 0.001,
        intervalHours: 8,
        cycles: 1,
        openFeeRate: 0.0006,
        closeFeeRate: 0.0006,
        slippageBps: 5,
        holdingDays: 0
      })
    ).toThrow(Error);
  });
});
