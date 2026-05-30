import type {
  CashCarryInput,
  CashCarryResult,
  DiscoveryCandidate,
  HedgeabilityInput,
  HedgeabilityVerdict
} from "./types.js";

export type NormalizedFundingRate = {
  dailyRate: number;
  annualizedRate: number;
};

export type SingleSidedStrengthInput = {
  change24h?: number;
  dailyRate: number;
  intervalShortened: boolean;
};

export type DiscoveryCandidateInput = {
  symbol: string;
  exchange: string;
  rawRate: number;
  intervalHours: number;
  change24h?: number;
  change7d?: number;
};

export function normalizeFundingRate(
  rate: number,
  intervalHours: number
): NormalizedFundingRate {
  if (intervalHours <= 0) {
    throw new Error("intervalHours must be greater than 0");
  }

  const dailyRate = (rate / intervalHours) * 24;
  const annualizedRate = dailyRate * 365;

  return { dailyRate, annualizedRate };
}

export function isExtremeFundingRate(
  dailyRate: number,
  threshold = 0.003
): boolean {
  return Math.abs(dailyRate) >= threshold;
}

export function getTrendDirection(
  rate: number
): DiscoveryCandidate["trendDirection"] {
  return rate < 0 ? "short_crowded" : "long_crowded";
}

export function isIntervalShortened(intervalHours: number): boolean {
  return intervalHours < 8;
}

export function classifySingleSidedStrength(
  params: SingleSidedStrengthInput
): DiscoveryCandidate["singleSidedStrength"] {
  const change24h = Math.abs(params.change24h || 0);
  const dailyRate = Math.abs(params.dailyRate);

  if (
    change24h >= 0.5 ||
    dailyRate >= 0.01 ||
    (params.intervalShortened && dailyRate >= 0.005)
  ) {
    return "severe";
  }

  if (change24h >= 0.2 || dailyRate >= 0.005 || params.intervalShortened) {
    return "clear";
  }

  return "mild";
}

export function buildDiscoveryCandidate(
  params: DiscoveryCandidateInput
): DiscoveryCandidate {
  const normalized = normalizeFundingRate(params.rawRate, params.intervalHours);
  const intervalShortened = isIntervalShortened(params.intervalHours);

  return {
    symbol: params.symbol,
    exchange: params.exchange,
    rawRate: params.rawRate,
    intervalHours: params.intervalHours,
    dailyRate: normalized.dailyRate,
    annualizedRate: normalized.annualizedRate,
    change24h: params.change24h,
    change7d: params.change7d,
    intervalShortened,
    trendDirection: getTrendDirection(params.rawRate),
    singleSidedStrength: classifySingleSidedStrength({
      change24h: params.change24h,
      dailyRate: normalized.dailyRate,
      intervalShortened
    })
  };
}

export function judgeHedgeability(
  input: HedgeabilityInput
): HedgeabilityVerdict {
  const base = createBaseVerdict(input);

  if (!input.secondLegExists) {
    return {
      ...base,
      hedgeable: "false",
      reason: "缺少第二条可对冲腿，不能形成 delta 中性。"
    };
  }

  if (!input.liquidityOk) {
    return {
      ...base,
      hedgeable: "false",
      reason: "流动性不足，目标仓位可能产生过大滑点。"
    };
  }

  if (input.spotBorrowAvailable === false) {
    return {
      ...base,
      hedgeable: "false",
      reason: "现货借币不可得，无法安全建立现货对冲腿。"
    };
  }

  if (input.spotBorrowRate !== undefined && input.spotBorrowRate > 0.001) {
    return {
      ...base,
      hedgeable: "conditional",
      reason: "借币利率较高，可能吃掉资金费收益。"
    };
  }

  if (input.marginAssetRisk === "high") {
    return {
      ...base,
      hedgeable: "conditional",
      reason: "保证金资产风险较高，需要额外风控。"
    };
  }

  if (input.spotBorrowAvailable === undefined) {
    return {
      ...base,
      hedgeable: "conditional",
      reason: "借贷可得性暂不可确认，需保守处理。"
    };
  }

  return {
    ...base,
    hedgeable: "true",
    reason: "存在可对冲腿，流动性满足要求。"
  };
}

export function calculateCashCarryNetReturn(
  input: CashCarryInput
): CashCarryResult {
  if (input.holdingDays <= 0) {
    throw new Error("holdingDays must be greater than 0");
  }

  const grossFunding = input.notional * input.fundingRate * input.cycles;
  const basisPnl = input.basisPnl || 0;
  const openFees = input.notional * input.openFeeRate * 2;
  const closeFees = input.notional * input.closeFeeRate * 2;
  const slippageCost = input.notional * (input.slippageBps / 10000) * 4;
  const borrowCost =
    input.notional * (input.borrowRatePerDay || 0) * input.holdingDays;
  const netProfit =
    grossFunding + basisPnl - openFees - closeFees - slippageCost - borrowCost;
  const netApr = (netProfit / input.notional / input.holdingDays) * 365;

  return {
    grossFunding,
    basisPnl,
    openFees,
    closeFees,
    slippageCost,
    borrowCost,
    netProfit,
    netApr
  };
}

function createBaseVerdict(input: HedgeabilityInput): HedgeabilityVerdict {
  return {
    hedgeable: "true",
    secondLegExists: input.secondLegExists,
    spotBorrow: {
      available:
        input.spotBorrowAvailable === undefined
          ? "unknown"
          : input.spotBorrowAvailable,
      rate: input.spotBorrowRate
    },
    liquidityOk: input.liquidityOk,
    depthUsd: input.depthUsd,
    marginAssetRisk: input.marginAssetRisk || "low",
    reason: ""
  };
}
