import type { ArbOpportunity, ScanSource } from "../services/scanner.js";
import type { FundingRate } from "../exchanges/types.js";

export const mockSource: ScanSource = "mock";

export const mockFundingRates: FundingRate[] = [
  {
    exchange: "binance",
    symbol: "BTC/USDT:USDT",
    rate: 0.00018,
    predictedNextRate: 0.00016,
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    markPrice: 68000,
    quoteVolume24h: 250000000,
    makerFee: 0.0002,
    takerFee: 0.0006
  },
  {
    exchange: "bybit",
    symbol: "BTC/USDT:USDT",
    rate: -0.00002,
    predictedNextRate: -0.00001,
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    markPrice: 68020,
    quoteVolume24h: 180000000,
    makerFee: 0.0002,
    takerFee: 0.0006
  },
  {
    exchange: "okx",
    symbol: "ETH/USDT:USDT",
    rate: 0.00012,
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    markPrice: 3600,
    quoteVolume24h: 90000000,
    makerFee: 0.0002,
    takerFee: 0.0006
  },
  {
    exchange: "gate",
    symbol: "ETH/USDT:USDT",
    rate: -0.00004,
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    markPrice: 3598,
    quoteVolume24h: 30000000,
    makerFee: 0.0002,
    takerFee: 0.0006
  },
  {
    exchange: "binance",
    symbol: "SOL/USDT:USDT",
    rate: 0.00009,
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    markPrice: 145,
    quoteVolume24h: 20000000,
    makerFee: 0.0002,
    takerFee: 0.0006
  },
  {
    exchange: "okx",
    symbol: "SOL/USDT:USDT",
    rate: -0.00003,
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    markPrice: 145.2,
    quoteVolume24h: 12000000,
    makerFee: 0.0002,
    takerFee: 0.0006
  }
];

export const mockOpportunities: ArbOpportunity[] = [
  {
    symbol: "BTC/USDT:USDT",
    legA: {
      exchange: "binance",
      rate: 0.00018,
      side: "short"
    },
    legB: {
      exchange: "bybit",
      rate: -0.00002,
      side: "long"
    },
    spread: 0.0002,
    netEdge: -0.001,
    predictedSpread: 0.00017,
    estApr: 0.219,
    netApr: -1.095,
    liquidity: "high",
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    fakeOpportunity: true,
    direction: "short binance / long bybit"
  },
  {
    symbol: "ETH/USDT:USDT",
    legA: {
      exchange: "okx",
      rate: 0.00012,
      side: "short"
    },
    legB: {
      exchange: "gate",
      rate: -0.00004,
      side: "long"
    },
    spread: 0.00016,
    netEdge: -0.00104,
    estApr: 0.1752,
    netApr: -1.1388,
    liquidity: "mid",
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    fakeOpportunity: true,
    direction: "short okx / long gate"
  },
  {
    symbol: "SOL/USDT:USDT",
    legA: {
      exchange: "binance",
      rate: 0.00009,
      side: "short"
    },
    legB: {
      exchange: "okx",
      rate: -0.00003,
      side: "long"
    },
    spread: 0.00012,
    netEdge: -0.00108,
    estApr: 0.1314,
    netApr: -1.1826,
    liquidity: "mid",
    intervalHours: 8,
    nextFundingTime: Date.now() + 4 * 60 * 60 * 1000,
    fakeOpportunity: true,
    direction: "short binance / long okx"
  }
];
