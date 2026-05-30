export type ApiSource = "live" | "partial" | "mock";

export type ExchangeId = "binance" | "bybit" | "okx" | "gate";

export type Side = "long" | "short";

export type Liquidity = "high" | "mid" | "low";

export type ArbOpportunity = {
  symbol: string;
  legA: {
    exchange: ExchangeId;
    rate: number;
    side: Side;
  };
  legB: {
    exchange: ExchangeId;
    rate: number;
    side: Side;
  };
  spread: number;
  netEdge: number;
  predictedSpread?: number;
  estApr: number;
  netApr: number;
  liquidity: Liquidity;
  intervalHours: number;
  nextFundingTime?: number;
  fakeOpportunity: boolean;
  direction: string;
};

export type FundingRate = {
  exchange: ExchangeId;
  symbol: string;
  rate: number;
  predictedNextRate?: number;
  intervalHours: number;
  nextFundingTime?: number;
  markPrice?: number;
  quoteVolume24h?: number;
  makerFee: number;
  takerFee: number;
};

export type OpportunitiesResponse = {
  ok: boolean;
  source: ApiSource;
  updatedAt: string;
  errors: Record<string, string>;
  data: ArbOpportunity[];
};

export type FundingRatesResponse = {
  ok: boolean;
  source: ApiSource;
  updatedAt: string;
  errors: Record<string, string>;
  data: FundingRate[];
};
