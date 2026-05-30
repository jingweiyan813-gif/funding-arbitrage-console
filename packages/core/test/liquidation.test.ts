import { describe, expect, it } from "vitest";
import {
  calculateLiquidation,
  calculateLiquidationPrice,
  calculateSafetyBuffer,
  getRiskLevel
} from "../src";

describe("liquidation calculations", () => {
  it("calculates long liquidation price", () => {
    expect(
      calculateLiquidationPrice({
        side: "long",
        markPrice: 100,
        leverage: 5,
        margin: 20,
        maintMarginRate: 0.005
      })
    ).toBeCloseTo(80.5);
  });

  it("calculates short liquidation price", () => {
    expect(
      calculateLiquidationPrice({
        side: "short",
        markPrice: 100,
        leverage: 5,
        margin: 20,
        maintMarginRate: 0.005
      })
    ).toBeCloseTo(119.5);
  });

  it("calculates long safety buffer", () => {
    expect(calculateSafetyBuffer(100, 90, "long")).toBeCloseTo(10);
  });

  it("calculates short safety buffer", () => {
    expect(calculateSafetyBuffer(100, 110, "short")).toBeCloseTo(10);
  });

  it("returns critical when distance percent is below 5", () => {
    expect(getRiskLevel(4.99, 2)).toBe("critical");
  });

  it("returns warning when leverage is greater than 3", () => {
    expect(getRiskLevel(12, 4)).toBe("warning");
    expect(
      calculateLiquidation({
        side: "long",
        markPrice: 100,
        leverage: 4,
        margin: 25,
        maintMarginRate: 0.005
      }).warning
    ).toBe("杠杆超过 3x，建议降低杠杆或增加保证金缓冲。");
  });

  it("adds critical warning when distance percent is below 5", () => {
    const result = calculateLiquidation({
      side: "long",
      markPrice: 100,
      leverage: 100,
      margin: 1,
      maintMarginRate: 0.005
    });

    expect(result.riskLevel).toBe("critical");
    expect(result.warning).toBe("距离强平价过近，存在较高爆仓风险。");
  });

  it("throws on invalid input", () => {
    expect(() =>
      calculateLiquidationPrice({
        side: "long",
        markPrice: 0,
        leverage: 1,
        margin: 1,
        maintMarginRate: 0
      })
    ).toThrow(Error);
    expect(() =>
      calculateLiquidationPrice({
        side: "long",
        markPrice: 1,
        leverage: 0,
        margin: 1,
        maintMarginRate: 0
      })
    ).toThrow(Error);
    expect(() =>
      calculateLiquidationPrice({
        side: "long",
        markPrice: 1,
        leverage: 1,
        margin: 0,
        maintMarginRate: 0
      })
    ).toThrow(Error);
    expect(() =>
      calculateLiquidationPrice({
        side: "long",
        markPrice: 1,
        leverage: 1,
        margin: 1,
        maintMarginRate: -0.01
      })
    ).toThrow(Error);
  });
});
