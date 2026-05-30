export type ExchangeId = "binance" | "bybit" | "okx" | "gate";

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

export type Ticker = {
  exchange: ExchangeId;
  symbol: string;
  markPrice?: number;
  quoteVolume24h?: number;
};

export type MarketMeta = {
  exchange: ExchangeId;
  symbol: string;
  minOrderSize?: number;
  contractSize?: number;
  maintMarginRate?: number;
  makerFee: number;
  takerFee: number;
};

export interface Exchange {
  getFundingRate(symbol: string): Promise<FundingRate>;
  getFundingRates(symbols?: string[]): Promise<FundingRate[]>;
  getTicker(symbol: string): Promise<Ticker>;
  getMarketMeta(symbol: string): Promise<MarketMeta>;
  getBalance(): Promise<never>;
  getPositions(): Promise<never>;
  createOrder(): Promise<never>;
  cancelOrder(): Promise<never>;
}
