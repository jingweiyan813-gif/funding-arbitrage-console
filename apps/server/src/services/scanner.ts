import {
  calculateEstimatedApr,
  calculateNetEdge,
  calculateSpread
} from "@funding-arbitrage-console/core";
import { CcxtPublicExchange } from "../exchanges/CcxtPublicExchange.js";
import type { ExchangeId, FundingRate } from "../exchanges/types.js";
import { mockFundingRates, mockOpportunities } from "../mock/mockData.js";

export type ScanSource = "live" | "partial" | "mock";
export type LiquidityLevel = "high" | "mid" | "low";
export type OpportunitySort = "spread" | "netEdge";

export type ArbOpportunity = {
  symbol: string;
  legA: {
    exchange: ExchangeId;
    rate: number;
    side: "long" | "short";
  };
  legB: {
    exchange: ExchangeId;
    rate: number;
    side: "long" | "short";
  };
  spread: number;
  netEdge: number;
  predictedSpread?: number;
  estApr: number;
  netApr: number;
  liquidity: LiquidityLevel;
  intervalHours: number;
  nextFundingTime?: number;
  fakeOpportunity: boolean;
  direction: string;
};

export type ScanOptions = {
  sort?: OpportunitySort;
  threshold?: number;
  includeLowLiquidity?: boolean;
};

export type ScanResult = {
  source: ScanSource;
  updatedAt: string;
  errors: Record<string, string>;
  fundingRates: FundingRate[];
  opportunities: ArbOpportunity[];
};

const EXCHANGE_IDS: ExchangeId[] = ["binance", "bybit", "okx", "gate"];
const CACHE_TTL_MS = 30_000;
const DEFAULT_THRESHOLD = 0.0001;

let cachedResult: ScanResult | undefined;
let cachedAt = 0;

export async function getFundingRates(
  options: Pick<ScanOptions, "includeLowLiquidity"> = {}
): Promise<Omit<ScanResult, "opportunities">> {
  const result = await scan();
  const fundingRates = options.includeLowLiquidity
    ? result.fundingRates
    : result.fundingRates.filter(
        (rate) => classifyLiquidity(rate.quoteVolume24h) !== "low"
      );

  return {
    source: result.source,
    updatedAt: result.updatedAt,
    errors: result.errors,
    fundingRates
  };
}

export async function getOpportunities(
  options: ScanOptions = {}
): Promise<Omit<ScanResult, "fundingRates">> {
  const result = await scan();
  const source = result.opportunities.length > 0 ? result.source : "mock";
  const baseOpportunities =
    result.opportunities.length > 0 ? result.opportunities : mockOpportunities;
  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  const sort = options.sort ?? "netEdge";
  const opportunities = baseOpportunities
    .filter((opportunity) => options.includeLowLiquidity || opportunity.liquidity !== "low")
    .filter((opportunity) => opportunity.spread >= threshold)
    .sort((left, right) => right[sort] - left[sort]);

  return {
    source,
    updatedAt: result.updatedAt,
    errors: result.errors,
    opportunities
  };
}

export async function scan(): Promise<ScanResult> {
  if (cachedResult && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedResult;
  }

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
    return cacheResult({
      source: "mock",
      updatedAt: new Date().toISOString(),
      errors,
      fundingRates: mockFundingRates,
      opportunities: mockOpportunities
    });
  }

  return cacheResult({
    source: Object.keys(errors).length === 0 ? "live" : "partial",
    updatedAt: new Date().toISOString(),
    errors,
    fundingRates,
    opportunities: buildOpportunities(fundingRates)
  });
}

export function buildOpportunities(fundingRates: FundingRate[]): ArbOpportunity[] {
  const ratesBySymbol = new Map<string, FundingRate[]>();

  for (const rate of fundingRates) {
    const rates = ratesBySymbol.get(rate.symbol) ?? [];
    rates.push(rate);
    ratesBySymbol.set(rate.symbol, rates);
  }

  const opportunities: ArbOpportunity[] = [];

  for (const [symbol, rates] of ratesBySymbol.entries()) {
    for (let i = 0; i < rates.length; i += 1) {
      for (let j = i + 1; j < rates.length; j += 1) {
        opportunities.push(buildOpportunity(symbol, rates[i], rates[j]));
      }
    }
  }

  return opportunities;
}

function buildOpportunity(
  symbol: string,
  first: FundingRate,
  second: FundingRate
): ArbOpportunity {
  const highRateLeg = first.rate >= second.rate ? first : second;
  const lowRateLeg = first.rate >= second.rate ? second : first;
  const spread = calculateSpread(first.rate, second.rate);
  const netEdge = calculateNetEdge(spread, first.takerFee, second.takerFee);
  const intervalHours = Math.min(first.intervalHours, second.intervalHours);
  const predictedSpread =
    first.predictedNextRate !== undefined && second.predictedNextRate !== undefined
      ? calculateSpread(first.predictedNextRate, second.predictedNextRate)
      : undefined;
  const liquidity = classifyLiquidity(
    Math.min(first.quoteVolume24h ?? 0, second.quoteVolume24h ?? 0)
  );

  return {
    symbol,
    legA: {
      exchange: highRateLeg.exchange,
      rate: highRateLeg.rate,
      side: "short"
    },
    legB: {
      exchange: lowRateLeg.exchange,
      rate: lowRateLeg.rate,
      side: "long"
    },
    spread,
    netEdge,
    predictedSpread,
    estApr: calculateEstimatedApr(spread, intervalHours),
    netApr: calculateEstimatedApr(netEdge, intervalHours),
    liquidity,
    intervalHours,
    nextFundingTime:
      first.nextFundingTime !== undefined && second.nextFundingTime !== undefined
        ? Math.min(first.nextFundingTime, second.nextFundingTime)
        : first.nextFundingTime ?? second.nextFundingTime,
    fakeOpportunity: netEdge <= 0,
    direction: `short ${highRateLeg.exchange} / long ${lowRateLeg.exchange}`
  };
}

function classifyLiquidity(quoteVolume24h?: number): LiquidityLevel {
  const volume = quoteVolume24h ?? 0;

  if (volume >= 100_000_000) {
    return "high";
  }

  if (volume >= 10_000_000) {
    return "mid";
  }

  return "low";
}

function cacheResult(result: ScanResult): ScanResult {
  cachedResult = result;
  cachedAt = Date.now();
  return result;
}
