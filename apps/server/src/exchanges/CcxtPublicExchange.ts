import ccxt from "ccxt";
import type {
  Exchange,
  ExchangeId,
  FundingRate,
  MarketMeta,
  Ticker
} from "./types.js";

const DEFAULT_MAKER_FEE = 0.0002;
const DEFAULT_TAKER_FEE = 0.0006;
const DEFAULT_INTERVAL_HOURS = 8;
const PRIVATE_OPERATION_ERROR =
  "Private account operations are not implemented in Phase 1.";

type CcxtExchange = InstanceType<typeof ccxt.Exchange>;
type CcxtMarket = {
  symbol?: string;
  swap?: boolean;
  linear?: boolean;
  quote?: string;
  settle?: string;
  contractSize?: number;
  limits?: {
    amount?: {
      min?: number;
    };
  };
};
type CcxtFundingRate = {
  symbol?: string;
  fundingRate?: number;
  nextFundingRate?: number;
  nextFundingTimestamp?: number;
  fundingTimestamp?: number;
  markPrice?: number;
  interval?: string;
  info?: Record<string, unknown>;
};
type CcxtTicker = {
  symbol?: string;
  mark?: number;
  markPrice?: number;
  last?: number;
  quoteVolume?: number;
  baseVolume?: number;
  info?: Record<string, unknown>;
};

export class NotImplementedError extends Error {
  constructor() {
    super(PRIVATE_OPERATION_ERROR);
    this.name = "NotImplementedError";
  }
}

export class CcxtPublicExchange implements Exchange {
  private readonly client: CcxtExchange;
  private readonly makerFee = DEFAULT_MAKER_FEE;
  private readonly takerFee = DEFAULT_TAKER_FEE;
  private readonly intervalHours = DEFAULT_INTERVAL_HOURS;

  constructor(private readonly id: ExchangeId) {
    const ExchangeClass = this.getExchangeClass(id);
    this.client = new ExchangeClass({
      enableRateLimit: true,
      options: {
        defaultType: "swap",
        defaultSubType: "linear"
      }
    }) as CcxtExchange;
  }

  async getFundingRate(symbol: string): Promise<FundingRate> {
    await this.loadMarkets();
    const unifiedSymbol = this.normalizeSymbol(symbol);
    const fundingRate = await this.fetchSingleFundingRate(unifiedSymbol);
    const ticker = await this.tryGetTicker(unifiedSymbol);

    return this.toFundingRate(fundingRate, ticker, unifiedSymbol);
  }

  async getFundingRates(symbols?: string[]): Promise<FundingRate[]> {
    await this.loadMarkets();
    const unifiedSymbols = symbols?.length
      ? symbols.map((symbol) => this.normalizeSymbol(symbol))
      : this.getLinearUsdtSwapSymbols();

    const fundingRates = await this.fetchFundingRatesWithFallback(unifiedSymbols);
    const tickerBySymbol = await this.fetchTickersWithFallback(unifiedSymbols);

    return fundingRates
      .map((fundingRate) => {
        const symbol = fundingRate.symbol ?? "";
        const ticker = tickerBySymbol.get(symbol);
        return this.toFundingRate(fundingRate, ticker, symbol);
      })
      .filter((rate) => unifiedSymbols.includes(rate.symbol));
  }

  async getTicker(symbol: string): Promise<Ticker> {
    await this.loadMarkets();
    const unifiedSymbol = this.normalizeSymbol(symbol);
    const ticker = await this.fetchTickerSafe(unifiedSymbol);

    return {
      exchange: this.id,
      symbol: unifiedSymbol,
      markPrice: this.extractMarkPrice(ticker),
      quoteVolume24h: this.extractQuoteVolume(ticker)
    };
  }

  async getMarketMeta(symbol: string): Promise<MarketMeta> {
    await this.loadMarkets();
    const unifiedSymbol = this.normalizeSymbol(symbol);
    const market = this.client.market(unifiedSymbol) as CcxtMarket;

    return {
      exchange: this.id,
      symbol: unifiedSymbol,
      minOrderSize: market.limits?.amount?.min,
      contractSize: market.contractSize,
      makerFee: this.makerFee,
      takerFee: this.takerFee
    };
  }

  async getBalance(): Promise<never> {
    throw new NotImplementedError();
  }

  async getPositions(): Promise<never> {
    throw new NotImplementedError();
  }

  async createOrder(): Promise<never> {
    throw new NotImplementedError();
  }

  async cancelOrder(): Promise<never> {
    throw new NotImplementedError();
  }

  private getExchangeClass(id: ExchangeId) {
    if (id === "binance") {
      return ccxt.binanceusdm;
    }

    return ccxt[id];
  }

  private async loadMarkets(): Promise<void> {
    await this.client.loadMarkets();
  }

  private getLinearUsdtSwapSymbols(): string[] {
    const markets = Object.values(this.client.markets ?? {}) as CcxtMarket[];

    return markets
      .filter(
        (market) =>
          market.symbol &&
          market.swap === true &&
          market.linear === true &&
          (market.quote === "USDT" || market.settle === "USDT")
      )
      .map((market) => market.symbol as string);
  }

  private normalizeSymbol(symbol: string): string {
    if (this.client.markets?.[symbol]) {
      return symbol;
    }

    const markets = Object.values(this.client.markets ?? {}) as CcxtMarket[];
    const market = markets.find((candidate) => candidate.symbol === symbol);
    return market?.symbol ?? symbol;
  }

  private async fetchSingleFundingRate(symbol: string): Promise<CcxtFundingRate> {
    try {
      return (await this.client.fetchFundingRate(symbol)) as CcxtFundingRate;
    } catch {
      const rates = await this.fetchFundingRatesWithFallback([symbol]);
      const rate = rates.find((item) => item.symbol === symbol);
      if (!rate) {
        throw new Error(`Funding rate not found for ${symbol}`);
      }
      return rate;
    }
  }

  private async fetchFundingRatesWithFallback(
    symbols: string[]
  ): Promise<CcxtFundingRate[]> {
    try {
      const response = (await this.client.fetchFundingRates(symbols)) as Record<
        string,
        CcxtFundingRate
      >;
      return Object.values(response);
    } catch {
      const settled = await Promise.allSettled(
        symbols.map(
          async (symbol): Promise<CcxtFundingRate> =>
            (await this.client.fetchFundingRate(symbol)) as CcxtFundingRate
        )
      );

      return settled
        .filter(
          (result): result is PromiseFulfilledResult<CcxtFundingRate> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);
    }
  }

  private async fetchTickersWithFallback(
    symbols: string[]
  ): Promise<Map<string, CcxtTicker>> {
    try {
      const response = (await this.client.fetchTickers(symbols)) as Record<
        string,
        CcxtTicker
      >;
      return new Map<string, CcxtTicker>(
        Object.entries(response).map(([symbol, ticker]) => [
          ticker.symbol ?? symbol,
          ticker
        ] as [string, CcxtTicker])
      );
    } catch {
      const settled = await Promise.allSettled(
        symbols.map((symbol) => this.fetchTickerSafe(symbol))
      );
      return new Map<string, CcxtTicker>(
        settled
          .filter(
            (result): result is PromiseFulfilledResult<CcxtTicker> =>
              result.status === "fulfilled"
          )
          .map(
            (result): [string, CcxtTicker] => [
              result.value.symbol ?? "",
              result.value
            ]
          )
          .filter(([symbol]) => symbol.length > 0)
      );
    }
  }

  private async tryGetTicker(symbol: string): Promise<CcxtTicker | undefined> {
    try {
      return await this.fetchTickerSafe(symbol);
    } catch {
      return undefined;
    }
  }

  private async fetchTickerSafe(symbol: string): Promise<CcxtTicker> {
    return (await this.client.fetchTicker(symbol)) as CcxtTicker;
  }

  private toFundingRate(
    fundingRate: CcxtFundingRate,
    ticker: CcxtTicker | undefined,
    fallbackSymbol: string
  ): FundingRate {
    const symbol = fundingRate.symbol ?? ticker?.symbol ?? fallbackSymbol;
    const rate = this.toNumber(fundingRate.fundingRate) ?? 0;

    return {
      exchange: this.id,
      symbol,
      rate,
      predictedNextRate: this.toNumber(fundingRate.nextFundingRate),
      intervalHours:
        this.parseIntervalHours(fundingRate.interval) ?? this.intervalHours,
      nextFundingTime:
        this.toNumber(fundingRate.nextFundingTimestamp) ??
        this.toNumber(fundingRate.fundingTimestamp),
      markPrice:
        this.toNumber(fundingRate.markPrice) ?? this.extractMarkPrice(ticker),
      quoteVolume24h: this.extractQuoteVolume(ticker),
      makerFee: this.makerFee,
      takerFee: this.takerFee
    };
  }

  private extractMarkPrice(ticker?: CcxtTicker): number | undefined {
    return (
      this.toNumber(ticker?.markPrice) ??
      this.toNumber(ticker?.mark) ??
      this.toNumber(ticker?.last)
    );
  }

  private extractQuoteVolume(ticker?: CcxtTicker): number | undefined {
    return (
      this.toNumber(ticker?.quoteVolume) ??
      this.toNumber(ticker?.info?.quoteVolume) ??
      this.toNumber(ticker?.info?.turnover24h) ??
      this.toNumber(ticker?.info?.volCcy24h)
    );
  }

  private parseIntervalHours(interval?: string): number | undefined {
    if (!interval) {
      return undefined;
    }

    const match = interval.match(/^(\d+)\s*h$/i);
    if (!match) {
      return undefined;
    }

    return Number(match[1]);
  }

  private toNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }
}
