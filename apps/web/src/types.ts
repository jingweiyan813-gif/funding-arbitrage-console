export type ApiSource = "live" | "partial" | "mock";

export type ExchangeId = "binance" | "bybit" | "okx" | "gate";

export type Side = "long" | "short";

export type Liquidity = "high" | "mid" | "low";

export type StrategyType = "cross_exchange_perp" | "cash_and_carry";

export type PaperLegType = "spot" | "perp";

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
  strategyType?: StrategyType;
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

export type ActiveTab =
  | "opportunityMining"
  | "scanner"
  | "calculator"
  | "liquidation"
  | "paper"
  | "monitor"
  | "liveAccount"
  | "education";

export type CalculatorSeed = {
  symbol: string;
  legA: ArbOpportunity["legA"];
  legB: ArbOpportunity["legB"];
  notional: number;
  cycles: number;
  intervalHours: number;
  slippageBps: number;
};

export type LiquidationSeed = {
  symbol: string;
  markPrice: number;
  legA: {
    side: Side;
  };
  legB: {
    side: Side;
  };
  leverage: number;
  margin: number;
  maintMarginRate: number;
};


export type PaperAccount = {
  id: string;
  equity: number;
  baseCurrency: "USDT";
  realizedPnl: number;
  totalFundingReceived: number;
  totalFees: number;
};

export type PaperPosition = {
  id: string;
  accountId: string;
  exchange: string;
  symbol: string;
  side: Side;
  notional: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  maintMarginRate: number;
  liqPrice: number;
  status: "open" | "closed" | "liquidated";
  openedAt: number;
  closedAt?: number;
  unrealizedPnl?: number;
  strategyType?: StrategyType;
  legType?: PaperLegType;
  borrowRatePerDay?: number;
  holdingDays?: number;
  basisPnl?: number;
};

export type PaperTrade = {
  id: string;
  accountId: string;
  positionId: string;
  type: "open" | "close" | "liquidation";
  side: Side;
  symbol: string;
  exchange: string;
  price: number;
  notional: number;
  fee: number;
  slippageCost: number;
  realizedPnl: number;
  createdAt: number;
  strategyType?: StrategyType;
  legType?: PaperLegType;
  meta?: Record<string, unknown>;
};

export type FundingSettlement = {
  id: string;
  accountId: string;
  positionId: string;
  symbol: string;
  exchange: string;
  rate: number;
  amount: number;
  createdAt: number;
};

export type LedgerEvent = {
  id: string;
  type: "trade" | "funding";
  time: number;
  title: string;
  amount: number;
  meta?: Record<string, unknown>;
};

export type PaperSeed = ArbOpportunity;


export type MiningCategory = "true" | "conditional" | "trap";

export type MiningSource = "live" | "partial" | "fallback_snapshot";

export type MinedOpportunity = {
  symbol: string;
  exchange: ExchangeId;
  rawRate: number;
  intervalHours: number;
  dailyRate: number;
  annualizedRate: number;
  change24h?: number;
  intervalShortened: boolean;
  trendDirection: "long_crowded" | "short_crowded";
  singleSidedStrength: "mild" | "clear" | "severe";
  hedgeability: {
    hedgeable: "true" | "false" | "conditional";
    secondLegExists: boolean;
    spotBorrow: {
      available: boolean | "unknown";
      rate?: number;
    };
    liquidityOk: boolean;
    depthUsd?: number;
    marginAssetRisk: "low" | "high";
    reason: string;
  };
  category: MiningCategory;
  strategyType: "cross_exchange_perp" | "cash_and_carry";
  reason: string;
};

export type MiningResponse = {
  ok: boolean;
  source: MiningSource;
  updatedAt: string;
  errors: Record<string, string>;
  data: MinedOpportunity[];
};
