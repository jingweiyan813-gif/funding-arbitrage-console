import {
  applyFundingToAccount,
  calculateFundingSettlementAmount,
  roundMoney
} from "@funding-arbitrage-console/core";
import type { FundingSettlement, PaperAccount } from "@funding-arbitrage-console/core";
import { getStore, saveStore, type ServerPaperPosition } from "../data/store.js";
import { CcxtPublicExchange } from "../exchanges/CcxtPublicExchange.js";
import type { ExchangeId } from "../exchanges/types.js";

export type SettlePositionFundingParams = {
  positionId: string;
  fundingTime?: number;
  rate?: number;
};

export type SettleAllOpenPositionsParams = {
  fundingTime?: number;
};

export type FundingSettlementResult =
  | {
      skipped: true;
      positionId: string;
      reason: "position_not_found" | "position_not_open" | "already_settled" | "funding_rate_unavailable";
    }
  | {
      skipped: false;
      settlement: FundingSettlement;
      account: PaperAccount;
    };

const SUPPORTED_EXCHANGES: ExchangeId[] = ["binance", "bybit", "okx", "gate"];

export async function settlePositionFunding(
  params: SettlePositionFundingParams
): Promise<FundingSettlementResult> {
  const fundingTime = params.fundingTime ?? Date.now();
  const store = await getStore();
  const position = store.positions.find((item) => item.id === params.positionId);

  if (!position) {
    return { skipped: true, positionId: params.positionId, reason: "position_not_found" };
  }

  if (position.status !== "open") {
    return { skipped: true, positionId: position.id, reason: "position_not_open" };
  }

  if (hasCursor(store, position.id, fundingTime)) {
    return { skipped: true, positionId: position.id, reason: "already_settled" };
  }

  const rate =
    params.rate ?? (await resolveFundingRate(position).catch(() => undefined));

  if (rate === undefined) {
    return { skipped: true, positionId: position.id, reason: "funding_rate_unavailable" };
  }

  const now = Date.now();
  const amount = calculateFundingSettlementAmount({
    side: position.side,
    rate,
    notional: position.notional
  });
  const settlement: FundingSettlement = {
    id: createId("paper-funding", now),
    accountId: position.accountId,
    positionId: position.id,
    symbol: position.symbol,
    exchange: position.exchange,
    rate,
    amount,
    createdAt: now
  };
  const account = applyFundingToAccount({
    account: store.account,
    settlementAmount: amount
  });

  await saveStore({
    ...store,
    account,
    fundingSettlements: [...store.fundingSettlements, settlement],
    settlementCursors: [
      ...store.settlementCursors,
      {
        positionId: position.id,
        fundingTime,
        createdAt: now
      }
    ]
  });

  return { skipped: false, settlement, account };
}

export async function settleAllOpenPositions(
  params: SettleAllOpenPositionsParams = {}
): Promise<FundingSettlementResult[]> {
  const store = await getStore();
  const openPositions = store.positions.filter(
    (position) => position.status === "open"
  );
  const results: FundingSettlementResult[] = [];

  for (const position of openPositions) {
    results.push(
      await settlePositionFunding({
        positionId: position.id,
        fundingTime: params.fundingTime
      })
    );
  }

  return results;
}

async function resolveFundingRate(position: ServerPaperPosition): Promise<number> {
  const exchange = new CcxtPublicExchange(normalizeExchangeId(position.exchange));
  const fundingRate = await exchange.getFundingRate(position.symbol);
  return roundMoney(fundingRate.rate);
}

function hasCursor(
  store: { settlementCursors: Array<{ positionId: string; fundingTime?: number }> },
  positionId: string,
  fundingTime: number
): boolean {
  return store.settlementCursors.some(
    (cursor) =>
      cursor.positionId === positionId && cursor.fundingTime === fundingTime
  );
}

function normalizeExchangeId(exchange: string): ExchangeId {
  if (SUPPORTED_EXCHANGES.includes(exchange as ExchangeId)) {
    return exchange as ExchangeId;
  }

  throw new Error("Unsupported paper exchange: " + exchange);
}

function createId(prefix: string, time: number): string {
  return prefix + "-" + time + "-" + Math.random().toString(36).slice(2, 10);
}
