import type { FundingRate, MarketMeta, Ticker } from "./types.js";
import { getAccount, listPositions } from "../data/store.js";

export class MockAccount {
  async getFundingRate(_symbol: string): Promise<FundingRate> {
    throw new Error("MockAccount does not provide public market data.");
  }

  async getFundingRates(_symbols?: string[]): Promise<FundingRate[]> {
    throw new Error("MockAccount does not provide public market data.");
  }

  async getTicker(_symbol: string): Promise<Ticker> {
    throw new Error("MockAccount does not provide public market data.");
  }

  async getMarketMeta(_symbol: string): Promise<MarketMeta> {
    throw new Error("MockAccount does not provide public market data.");
  }

  async getBalance(): Promise<{
    accountId: string;
    equity: number;
    baseCurrency: "USDT";
  }> {
    const account = await getAccount();

    return {
      accountId: account.id,
      equity: account.equity,
      baseCurrency: account.baseCurrency
    };
  }

  async getPositions() {
    return listPositions();
  }

  async createOrder(): Promise<never> {
    throw new Error(
      "Paper order execution is implemented in paperTrading service in P2-T3."
    );
  }

  async cancelOrder(): Promise<never> {
    throw new Error("Paper cancel order is not needed in Phase 2 MVP.");
  }
}
