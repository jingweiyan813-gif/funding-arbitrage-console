import {
  calculateCloseResult,
  calculateUnrealizedPnl,
  roundMoney,
  shouldLiquidate
} from "@funding-arbitrage-console/core";
import type { PaperAccount, Side, Trade } from "@funding-arbitrage-console/core";
import { getStore, saveStore, type ServerPaperPosition } from "../data/store.js";
import { CcxtPublicExchange } from "../exchanges/CcxtPublicExchange.js";
import type { ExchangeId } from "../exchanges/types.js";
import { mockFundingRates } from "../mock/mockData.js";

export type RefreshPriceResult = {
  updated: ServerPaperPosition[];
  skipped: Array<{ positionId: string; reason: string }>;
};

export type LiquidationEvent = {
  triggerPositionId: string;
  pairedPositionId?: string;
  account: PaperAccount;
  positions: ServerPaperPosition[];
  trades: Trade[];
};

const DEFAULT_FEE_RATE = 0.0006;
const DEFAULT_SLIPPAGE_BPS = 5;
const SUPPORTED_EXCHANGES: ExchangeId[] = ["binance", "bybit", "okx", "gate"];

export async function refreshOpenPositionsMarkPrice(): Promise<RefreshPriceResult> {
  const store = await getStore();
  const updated: ServerPaperPosition[] = [];
  const skipped: Array<{ positionId: string; reason: string }> = [];

  for (const position of store.positions.filter((item) => item.status === "open")) {
    const price = await resolveMarkPrice(position.exchange, position.symbol);
    if (price === undefined) {
      skipped.push({ positionId: position.id, reason: "mark_price_unavailable" });
      continue;
    }

    updated.push({
      ...position,
      markPrice: roundMoney(price),
      unrealizedPnl: calculateUnrealizedPnl({
        side: position.side,
        entryPrice: position.entryPrice,
        markPrice: price,
        notional: position.notional
      })
    });
  }

  if (updated.length > 0) {
    const latestStore = await getStore();
    const updatedById = new Map(updated.map((position) => [position.id, position] as const));
    await saveStore({
      ...latestStore,
      positions: latestStore.positions.map(
        (position) => updatedById.get(position.id) ?? position
      )
    });
  }

  return { updated, skipped };
}

export async function checkAndLiquidatePositions(): Promise<LiquidationEvent[]> {
  const store = await getStore();
  let account = store.account;
  const positions = [...store.positions];
  const trades = [...store.trades];
  const events: LiquidationEvent[] = [];
  const processed = new Set<string>();

  for (const position of positions.filter((item) => item.status === "open")) {
    if (processed.has(position.id)) {
      continue;
    }

    if (
      !shouldLiquidate({
        side: position.side,
        markPrice: position.markPrice,
        liqPrice: position.liqPrice
      })
    ) {
      continue;
    }

    const pair = findPair(positions, position);
    if (pair.length !== 2) {
      processed.add(position.id);
      continue;
    }

    const pairedPosition = pair.find((candidate) => candidate.id !== position.id);
    if (!pairedPosition || pairedPosition.status !== "open") {
      processed.add(position.id);
      continue;
    }

    const pairedMarkPrice =
      (await resolveMarkPrice(pairedPosition.exchange, pairedPosition.symbol)) ??
      pairedPosition.markPrice;
    const liquidationResult = closeForLiquidation({
      position,
      markPrice: position.markPrice,
      tradeType: "liquidation",
      index: 0
    });
    const pairedResult = closeForLiquidation({
      position: pairedPosition,
      markPrice: pairedMarkPrice,
      tradeType: "close",
      index: 1
    });
    const liquidatedPosition: ServerPaperPosition = {
      ...position,
      status: "liquidated",
      closedAt: liquidationResult.trade.createdAt,
      markPrice: roundMoney(position.markPrice),
      unrealizedPnl: liquidationResult.trade.realizedPnl
    };
    const closedPairedPosition: ServerPaperPosition = {
      ...pairedPosition,
      status: "closed",
      closedAt: pairedResult.trade.createdAt,
      markPrice: roundMoney(pairedMarkPrice),
      unrealizedPnl: pairedResult.trade.realizedPnl
    };
    const eventTrades = [liquidationResult.trade, pairedResult.trade];
    const realizedPnl = roundMoney(
      eventTrades.reduce((total, trade) => total + trade.realizedPnl, 0)
    );
    const fees = roundMoney(eventTrades.reduce((total, trade) => total + trade.fee, 0));

    account = {
      ...account,
      equity: roundMoney(account.equity + pairedPosition.margin + realizedPnl),
      realizedPnl: roundMoney(account.realizedPnl + realizedPnl),
      totalFees: roundMoney(account.totalFees + fees)
    };

    replacePosition(positions, liquidatedPosition);
    replacePosition(positions, closedPairedPosition);
    trades.push(...eventTrades);
    processed.add(position.id);
    processed.add(pairedPosition.id);
    events.push({
      triggerPositionId: position.id,
      pairedPositionId: pairedPosition.id,
      account,
      positions: [liquidatedPosition, closedPairedPosition],
      trades: eventTrades
    });
  }

  if (events.length > 0) {
    await saveStore({ ...store, account, positions, trades });
  }

  return events;
}

async function resolveMarkPrice(
  exchange: string,
  symbol: string
): Promise<number | undefined> {
  let exchangeId: ExchangeId;
  try {
    exchangeId = normalizeExchangeId(exchange);
  } catch {
    return undefined;
  }

  const client = new CcxtPublicExchange(exchangeId);
  try {
    const fundingRate = await client.getFundingRate(symbol);
    const price = normalizePrice(fundingRate.markPrice);
    if (price !== undefined) {
      return price;
    }
  } catch {
    // Ticker fallback below covers funding endpoints without mark price.
  }

  try {
    const ticker = await client.getTicker(symbol);
    const price = normalizePrice(ticker.markPrice);
    if (price !== undefined) {
      return price;
    }
  } catch {
    // Mock fallback keeps local paper trading usable when public APIs fail.
  }

  const mockRate = mockFundingRates.find(
    (rate) => rate.exchange === exchangeId && rate.symbol === symbol
  );
  return normalizePrice(mockRate?.markPrice);
}

function closeForLiquidation(params: {
  position: ServerPaperPosition;
  markPrice: number;
  tradeType: "close" | "liquidation";
  index: number;
}): { trade: Trade } {
  const now = Date.now();
  const exitPrice = applyExitSlippage(
    params.position.side,
    params.markPrice,
    DEFAULT_SLIPPAGE_BPS
  );
  const closeResult = calculateCloseResult({
    side: params.position.side,
    entryPrice: params.position.entryPrice,
    exitPrice,
    notional: params.position.notional,
    feeRate: DEFAULT_FEE_RATE,
    slippageBps: DEFAULT_SLIPPAGE_BPS
  });

  return {
    trade: {
      id: createId("paper-trade-" + params.tradeType, now, params.index),
      accountId: params.position.accountId,
      positionId: params.position.id,
      type: params.tradeType,
      side: params.position.side,
      symbol: params.position.symbol,
      exchange: params.position.exchange,
      price: roundMoney(exitPrice),
      notional: params.position.notional,
      fee: closeResult.fee,
      slippageCost: closeResult.slippageCost,
      realizedPnl: closeResult.realizedPnl,
      createdAt: now
    }
  };
}

function findPair(
  positions: ServerPaperPosition[],
  position: ServerPaperPosition
): ServerPaperPosition[] {
  return positions.filter(
    (candidate) =>
      candidate.accountId === position.accountId &&
      candidate.symbol === position.symbol &&
      candidate.openedAt === position.openedAt
  );
}

function replacePosition(
  positions: ServerPaperPosition[],
  nextPosition: ServerPaperPosition
): void {
  const index = positions.findIndex((position) => position.id === nextPosition.id);
  if (index >= 0) {
    positions[index] = nextPosition;
  }
}

function applyExitSlippage(
  side: Side,
  markPrice: number,
  slippageBps: number
): number {
  return side === "long"
    ? markPrice * (1 - slippageBps / 10000)
    : markPrice * (1 + slippageBps / 10000);
}

function normalizePrice(value: number | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }

  return undefined;
}

function normalizeExchangeId(exchange: string): ExchangeId {
  if (SUPPORTED_EXCHANGES.includes(exchange as ExchangeId)) {
    return exchange as ExchangeId;
  }

  throw new Error("Unsupported paper exchange: " + exchange);
}

function createId(prefix: string, time: number, index: number): string {
  return prefix + "-" + time + "-" + index + "-" + Math.random().toString(36).slice(2, 10);
}
