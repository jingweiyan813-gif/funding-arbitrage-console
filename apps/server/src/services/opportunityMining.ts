import {
  buildDiscoveryCandidate,
  isExtremeFundingRate,
  judgeHedgeability
} from "@funding-arbitrage-console/core";
import type {
  DiscoveryCandidate,
  HedgeabilityInput,
  HedgeabilityVerdict,
  StrategyType
} from "@funding-arbitrage-console/core";
import { CcxtPublicExchange } from "../exchanges/CcxtPublicExchange.js";
import type { ExchangeId, FundingRate } from "../exchanges/types.js";

export type MiningSource = "live" | "partial" | "fallback_snapshot";
export type MiningCategory = "true" | "conditional" | "trap";

export type MinedOpportunity = {
  symbol: string;
  exchange: string;
  rawRate: number;
  intervalHours: number;
  dailyRate: number;
  annualizedRate: number;
  change24h?: number;
  intervalShortened: boolean;
  trendDirection: "long_crowded" | "short_crowded";
  singleSidedStrength: "mild" | "clear" | "severe";
  hedgeability: HedgeabilityVerdict;
  category: MiningCategory;
  strategyType: StrategyType;
  reason: string;
};

export type MineOpportunitiesParams = {
  threshold?: number;
  limit?: number;
  includeTraps?: boolean;
};

export type MiningResult = {
  source: MiningSource;
  updatedAt: string;
  errors: Record<string, string>;
  data: MinedOpportunity[];
};

const EXCHANGE_IDS: ExchangeId[] = ["binance", "bybit", "okx", "gate"];
const DEFAULT_THRESHOLD = 0.003;
const DEFAULT_LIMIT = 50;
const MIN_LIQUIDITY_USD = 10_000_000;

export async function mineOpportunities(
  params: MineOpportunitiesParams = {}
): Promise<MiningResult> {
  const threshold = params.threshold ?? DEFAULT_THRESHOLD;
  const limit = params.limit ?? DEFAULT_LIMIT;
  const includeTraps = params.includeTraps ?? true;
  const errors: Record<string, string> = {};
  const settled = await Promise.allSettled(
    EXCHANGE_IDS.map(async (exchangeId) => {
      const exchange = new CcxtPublicExchange(exchangeId);
      const rates = await exchange.getFundingRates();
      return { exchangeId, rates };
    })
  );
  const fundingRates: FundingRate[] = [];

  settled.forEach((result, index) => {
    const exchangeId = EXCHANGE_IDS[index];
    if (result.status === "fulfilled") {
      fundingRates.push(...result.value.rates);
      return;
    }

    errors[exchangeId] =
      result.reason instanceof Error ? result.reason.message : String(result.reason);
  });

  if (fundingRates.length === 0) {
    return {
      source: "fallback_snapshot",
      updatedAt: new Date().toISOString(),
      errors,
      data: applyResultOptions(buildFallbackSnapshot(), includeTraps, limit)
    };
  }

  return {
    source: Object.keys(errors).length === 0 ? "live" : "partial",
    updatedAt: new Date().toISOString(),
    errors,
    data: applyResultOptions(
      buildMinedOpportunities(fundingRates, threshold),
      includeTraps,
      limit
    )
  };
}

export function buildMinedOpportunities(
  fundingRates: FundingRate[],
  threshold = DEFAULT_THRESHOLD
): MinedOpportunity[] {
  const symbolCounts = countSymbols(fundingRates);

  return fundingRates
    .map((rate) => buildMinedOpportunity(rate, symbolCounts))
    .filter((opportunity) => isExtremeFundingRate(opportunity.dailyRate, threshold))
    .sort((left, right) => Math.abs(right.dailyRate) - Math.abs(left.dailyRate));
}

function buildMinedOpportunity(
  fundingRate: FundingRate,
  symbolCounts: Map<string, number>
): MinedOpportunity {
  const candidate = buildDiscoveryCandidate({
    symbol: fundingRate.symbol,
    exchange: fundingRate.exchange,
    rawRate: fundingRate.rate,
    intervalHours: fundingRate.intervalHours
  });
  const secondLegExists = (symbolCounts.get(fundingRate.symbol) ?? 0) >= 2;
  const liquidityOk = (fundingRate.quoteVolume24h ?? 0) >= MIN_LIQUIDITY_USD;
  const hedgeability = judgeHedgeability({
    secondLegExists,
    liquidityOk,
    depthUsd: fundingRate.quoteVolume24h,
    spotBorrowAvailable: undefined,
    marginAssetRisk: "low"
  });
  const strategyType: StrategyType = secondLegExists
    ? "cross_exchange_perp"
    : "cash_and_carry";

  return fromCandidate({
    candidate,
    hedgeability,
    strategyType,
    reason: buildReason(hedgeability, strategyType)
  });
}

function buildFallbackSnapshot(): MinedOpportunity[] {
  const trueHedgeability = judgeHedgeability({
    secondLegExists: true,
    liquidityOk: true,
    depthUsd: 180_000_000,
    spotBorrowAvailable: true,
    spotBorrowRate: 0.0002,
    marginAssetRisk: "low"
  });
  const conditionalHedgeability = judgeHedgeability({
    secondLegExists: true,
    liquidityOk: true,
    depthUsd: 48_000_000,
    spotBorrowAvailable: undefined,
    marginAssetRisk: "low"
  });
  const trapHedgeability = judgeHedgeability({
    secondLegExists: false,
    liquidityOk: true,
    depthUsd: 32_000_000,
    spotBorrowAvailable: undefined,
    marginAssetRisk: "low"
  });

  return [
    fromCandidate({
      candidate: buildDiscoveryCandidate({
        symbol: "BTC/USDT:USDT",
        exchange: "binance",
        rawRate: 0.0014,
        intervalHours: 8,
        change24h: 0.18
      }),
      hedgeability: trueHedgeability,
      strategyType: "cross_exchange_perp",
      reason: "跨交易所存在可对冲腿，流动性满足要求，可作为真机会继续观察。"
    }),
    fromCandidate({
      candidate: buildDiscoveryCandidate({
        symbol: "ETH/USDT:USDT",
        exchange: "okx",
        rawRate: -0.0011,
        intervalHours: 8,
        change24h: -0.22
      }),
      hedgeability: conditionalHedgeability,
      strategyType: "cross_exchange_perp",
      reason: "资金费率极端且存在第二交易所，但借贷可得性暂不可确认，需要保守处理。"
    }),
    fromCandidate({
      candidate: buildDiscoveryCandidate({
        symbol: "ALT/USDT:USDT",
        exchange: "gate",
        rawRate: 0.002,
        intervalHours: 4,
        change24h: 0.56
      }),
      hedgeability: trapHedgeability,
      strategyType: "cash_and_carry",
      reason: "资金费率极端，但缺少可对冲腿，裸吃费率风险很高。"
    })
  ].sort((left, right) => Math.abs(right.dailyRate) - Math.abs(left.dailyRate));
}

function fromCandidate(params: {
  candidate: DiscoveryCandidate;
  hedgeability: HedgeabilityVerdict;
  strategyType: StrategyType;
  reason: string;
}): MinedOpportunity {
  return {
    symbol: params.candidate.symbol,
    exchange: params.candidate.exchange,
    rawRate: params.candidate.rawRate,
    intervalHours: params.candidate.intervalHours,
    dailyRate: params.candidate.dailyRate,
    annualizedRate: params.candidate.annualizedRate,
    change24h: params.candidate.change24h,
    intervalShortened: params.candidate.intervalShortened,
    trendDirection: params.candidate.trendDirection,
    singleSidedStrength: params.candidate.singleSidedStrength,
    hedgeability: params.hedgeability,
    category: toCategory(params.hedgeability),
    strategyType: params.strategyType,
    reason: params.reason
  };
}

function toCategory(hedgeability: HedgeabilityVerdict): MiningCategory {
  if (hedgeability.hedgeable === "true") {
    return "true";
  }

  if (hedgeability.hedgeable === "conditional") {
    return "conditional";
  }

  return "trap";
}

function buildReason(
  hedgeability: HedgeabilityVerdict,
  strategyType: StrategyType
): string {
  if (hedgeability.hedgeable === "false") {
    return hedgeability.reason;
  }

  if (hedgeability.hedgeable === "conditional") {
    return strategyType === "cash_and_carry"
      ? hedgeability.reason + " 当前仅标记为 cash-and-carry 候选，不假设一定可交易。"
      : hedgeability.reason;
  }

  return hedgeability.reason;
}

function countSymbols(fundingRates: FundingRate[]): Map<string, number> {
  const exchangesBySymbol = new Map<string, Set<ExchangeId>>();

  for (const rate of fundingRates) {
    const exchanges = exchangesBySymbol.get(rate.symbol) ?? new Set<ExchangeId>();
    exchanges.add(rate.exchange);
    exchangesBySymbol.set(rate.symbol, exchanges);
  }

  return new Map(
    [...exchangesBySymbol.entries()].map(([symbol, exchanges]) => [
      symbol,
      exchanges.size
    ])
  );
}

function applyResultOptions(
  opportunities: MinedOpportunity[],
  includeTraps: boolean,
  limit: number
): MinedOpportunity[] {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : DEFAULT_LIMIT;

  return opportunities
    .filter((opportunity) => includeTraps || opportunity.category !== "trap")
    .sort((left, right) => Math.abs(right.dailyRate) - Math.abs(left.dailyRate))
    .slice(0, safeLimit);
}
