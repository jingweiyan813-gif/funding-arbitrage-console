import { describe, expect, it } from "vitest";
import { calculateContractQuantity, calculateNotional } from "../src";

describe("sizing calculations", () => {
  it("uses the smaller available balance for notional", () => {
    expect(calculateNotional(1000, 800, 2)).toBe(1600);
  });

  it("calculates contract quantity", () => {
    expect(calculateContractQuantity(1000, 250, 0.1)).toBeCloseTo(40);
  });

  it("throws on invalid notional input", () => {
    expect(() => calculateNotional(-1, 100, 1)).toThrow(Error);
    expect(() => calculateNotional(100, -1, 1)).toThrow(Error);
    expect(() => calculateNotional(100, 100, 0)).toThrow(Error);
  });

  it("throws on invalid contract quantity input", () => {
    expect(() => calculateContractQuantity(-1, 100, 1)).toThrow(Error);
    expect(() => calculateContractQuantity(100, 0, 1)).toThrow(Error);
    expect(() => calculateContractQuantity(100, 100, 0)).toThrow(Error);
  });
});
