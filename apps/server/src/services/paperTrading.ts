import {
  calculateCloseResult,
  calculateLiquidation,
  calculateOpenCost,
  roundMoney
} from "@funding-arbitrage-console/core";
import type {
  PaperAccount,
  PaperPosition,
  Side,
  Trade
} from "@funding-arbitrage-console/core";
import {
  getStore,
  saveStore
} from "../data/store.js";
import { CcxtPublicExchange } from "../exchanges/CcxtPublicExchange.js";
import type { ExchangeId } from "../exchanges/types.js";
import { mockFundingRates } from "../mock/mockData.js";

export type PaperLegInput = {
  exchange: string;
  side: Side;
  rate?: number;
};

export type OpenPaperArbitragePositionParams = {
  symbol: string;
  legA: PaperLegInput;
  legB: PaperLegInput;
  notional?: number;
  leverage?: number;
  marginPerLeg?: number;
  feeRate?: number;
  slippageBps?: number;
  maintMarginRate?: number;
};

export type ClosePaperPositionPairParams = {
  positionIds: string[];
  feeRate?: number;
  slippageBps?: number;
};

export type PaperTradeResult = {
  account: PaperAccount;
  positions: PaperPosition[];
  trades: Trade[];
};

const DEFAULT_NOTIONAL = 1000;
const DEFAULT_LEVERAGE = 3;
const DEFAULT_FEE_RATE = 0.0006;
const DEFAULT_SLIPPAGE_BPS = 5;
const DEFAULT_MAINT_MARGIN_RATE = 0.005;
const SUPPORTED_EXCHANGES: ExchangeId[] = ["binance", "bybit", "okx", "gate"];

export async function openPaperArbitragePosition(
  params: OpenPaperArbitragePositionParams
): Promise<PaperTradeResult> {
  const now = Date.now();
  const symbol = requireNonEmptyString(params.symbol, "symbol");
  const notional = params.notional ?? DEFAULT_NOTIONAL;
  const leverage = params.leverage ?? DEFAULT_LEVERAGE;
  const marginPerLeg = params.marginPerLeg ?? notional / leverage;
  const feeRate = params.feeRate ?? DEFAULT_FEE_RATE;
  const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
  const maintMarginRate = params.maintMarginRate ?? DEFAULT_MAINT_MARGIN_RATE;
  const legA = normalizeLeg(params.legA, "legA");
  const legB = normalizeLeg(params.legB, "legB");

  assertPositive("notional", notional);
  assertPositive("leverage", leverage);
  assertPositive("marginPerLeg", marginPerLeg);
  assertNonNegative("feeRate", feeRate);
  assertNonNegative("slippageBps", slippageBps);
  assertNonNegative("maintMarginRate", maintMarginRate);

  const store = await getStore();
  const openCostA = calculateOpenCost({ notional, feeRate, slippageBps });
  const openCostB = calculateOpenCost({ notional, feeRate, slippageBps });
  const totalMargin = roundMoney(marginPerLeg * 2);
  const totalOpenFees = roundMoney(openCostA.fee + openCostB.fee);
  const totalSlippageCost = roundMoney(
    openCostA.slippageCost + openCostB.slippageCost
  );
  const totalRequired = roundMoney(totalMargin + totalOpenFees + totalSlippageCost);

  if (store.account.equity < totalRequired) {
    throw new Error("Insufficient paper equity");
  }

  const [markPriceA, markPriceB] = await Promise.all([
    resolveMarkPrice(legA.exchange, symbol),
    resolveMarkPrice(legB.exchange, symbol)
  ]);
  const positionA = createOpenPosition({
    accountId: store.account.id,
    exchange: legA.exchange,
    symbol,
    side: legA.side,
    notional,
    leverage,
    margin: marginPerLeg,
    maintMarginRate,
    markPrice: markPriceA,
    slippageBps,
    now,
    index: "A"
  });
  const positionB = createOpenPosition({
    accountId: store.account.id,
    exchange: legB.exchange,
    symbol,
    side: legB.side,
    notional,
    leverage,
    margin: marginPerLeg,
    maintMarginRate,
    markPrice: markPriceB,
    slippageBps,
    now,
    index: "B"
  });
  const tradeA = createOpenTrade({
    accountId: store.account.id,
    position: positionA,
    fee: openCostA.fee,
    slippageCost: openCostA.slippageCost,
    now,
    index: 0
  });
  const tradeB = createOpenTrade({
    accountId: store.account.id,
    position: positionB,
    fee: openCostB.fee,
    slippageCost: openCostB.slippageCost,
    now,
    index: 1
  });
  const account: PaperAccount = {
    ...store.account,
    equity: roundMoney(store.account.equity - totalRequired),
    totalFees: roundMoney(store.account.totalFees + totalOpenFees)
  };
  const positions = [positionA, positionB];
  const trades = [tradeA, tradeB];

  await saveStore({
    ...store,
    account,
    positions: [...store.positions, ...positions],
    trades: [...store.trades, ...trades]
  });

  return { account, positions, trades };
}

export async function closePaperPositionPair(
  params: ClosePaperPositionPairParams
): Promise<PaperTradeResult> {
  if (!Array.isArray(params.positionIds) || params.positionIds.length !== 2) {
    throw new Error("A paper arbitrage pair must contain exactly two positions");
  }

  const now = Date.now();
  const feeRate = params.feeRate ?? DEFAULT_FEE_RATE;
  const slippageBps = params.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
  assertNonNegative("feeRate", feeRate);
  assertNonNegative("slippageBps", slippageBps);

  const store = await getStore();
  const idSet = new Set(params.positionIds);
  const positionsToClose = store.positions.filter((position) =>
    idSet.has(position.id)
  );

  if (positionsToClose.length !== 2) {
    throw new Error("A paper arbitrage pair must contain exactly two positions");
  }

  for (const position of positionsToClose) {
    if (position.status !== "open") {
      throw new Error("Paper position must be open to close");
    }
  }

  const markPrices = await Promise.all(
    positionsToClose.map((position) =>
      resolveMarkPrice(normalizeExchangeId(position.exchange), position.symbol)
    )
  );
  const closeTrades: Trade[] = [];
  const closedPositions = positionsToClose.map((position, index) => {
    const markPrice = markPrices[index];
    const exitPrice = applyExitSlippage(position.side, markPrice, slippageBps);
    const closeResult = calculateCloseResult({
      side: position.side,
      entryPrice: position.entryPrice,
      exitPrice,
      notional: position.notional,
      feeRate,
      slippageBps
    });
    const closedPosition: PaperPosition = {
      ...position,
      markPrice,
      status: "closed",
      closedAt: now
    };
    closeTrades.push({
      id: createId("paper-trade-close", now, index),
      accountId: position.accountId,
      positionId: position.id,
      type: "close",
      side: position.side,
      symbol: position.symbol,
      exchange: position.exchange,
      price: roundMoney(exitPrice),
      notional: position.notional,
      fee: closeResult.fee,
      slippageCost: closeResult.slippageCost,
      realizedPnl: closeResult.realizedPnl,
      createdAt: now
    });
    return closedPosition;
  });
  const marginReturned = roundMoney(
    closedPositions.reduce((total, position) => total + position.margin, 0)
  );
  const realizedPnl = roundMoney(
    closeTrades.reduce((total, trade) => total + trade.realizedPnl, 0)
  );
  const closeFees = roundMoney(
    closeTrades.reduce((total, trade) => total + trade.fee, 0)
  );
  const account: PaperAccount = {
    ...store.account,
    equity: roundMoney(store.account.equity + marginReturned + realizedPnl),
    realizedPnl: roundMoney(store.account.realizedPnl + realizedPnl),
    totalFees: roundMoney(store.account.totalFees + closeFees)
  };
  const closedPositionById = new Map(
    closedPositions.map((position) => [position.id, position] as const)
  );

  await saveStore({
    ...store,
    account,
    positions: store.positions.map(
      (position) => closedPositionById.get(position.id) ?? position
    ),
    trades: [...store.trades, ...closeTrades]
  });

  return { account, positions: closedPositions, trades: closeTrades };
}

async function resolveMarkPrice(
  exchangeId: ExchangeId,
  symbol: string
): Promise<number> {
  const exchange = new CcxtPublicExchange(exchangeId);
  try {
    const fundingRate = await exchange.getFundingRate(symbol);
    const fundingMarkPrice = normalizePrice(fundingRate.markPrice);
    if (fundingMarkPrice !== undefined) {
      return fundingMarkPrice;
    }
  } catch {
    // Public funding endpoints can fail by exchange; ticker is the supported fallback.
  }

  try {
    const ticker = await exchange.getTicker(symbol);
    const tickerMarkPrice = normalizePrice(ticker.markPrice);
    if (tickerMarkPrice !== undefined) {
      return tickerMarkPrice;
    }
  } catch {
    // The caller receives the normalized price resolution error below.
  }

  const mockRate = mockFundingRates.find(
    (rate) => rate.exchange === exchangeId && rate.symbol === symbol
  );
  const mockMarkPrice = normalizePrice(mockRate?.markPrice);
  if (mockMarkPrice !== undefined) {
    return mockMarkPrice;
  }

  throw new Error("Unable to resolve mark price for " + exchangeId + " " + symbol);
}

function createOpenPosition(params: {
  accountId: string;
  exchange: ExchangeId;
  symbol: string;
  side: Side;
  notional: number;
  leverage: number;
  margin: number;
  maintMarginRate: number;
  markPrice: number;
  slippageBps: number;
  now: number;
  index: string;
}): PaperPosition {
  const entryPrice = applyEntrySlippage(
    params.side,
    params.markPrice,
    params.slippageBps
  );
  const liquidation = calculateLiquidation({
    side: params.side,
    markPrice: entryPrice,
    leverage: params.leverage,
    margin: params.margin,
    maintMarginRate: params.maintMarginRate
  });

  return {
    id: createId("paper-position-" + params.index, params.now, 0),
    accountId: params.accountId,
    exchange: params.exchange,
    symbol: params.symbol,
    side: params.side,
    notional: params.notional,
    leverage: params.leverage,
    entryPrice: roundMoney(entryPrice),
    markPrice: roundMoney(params.markPrice),
    margin: roundMoney(params.margin),
    maintMarginRate: params.maintMarginRate,
    liqPrice: roundMoney(liquidation.liqPrice),
    status: "open",
    openedAt: params.now
  };
}

function createOpenTrade(params: {
  accountId: string;
  position: PaperPosition;
  fee: number;
  slippageCost: number;
  now: number;
  index: number;
}): Trade {
  return {
    id: createId("paper-trade-open", params.now, params.index),
    accountId: params.accountId,
    positionId: params.position.id,
    type: "open",
    side: params.position.side,
    symbol: params.position.symbol,
    exchange: params.position.exchange,
    price: params.position.entryPrice,
    notional: params.position.notional,
    fee: params.fee,
    slippageCost: params.slippageCost,
    realizedPnl: 0,
    createdAt: params.now
  };
}

function normalizeLeg(leg: PaperLegInput | undefined, name: string): {
  exchange: ExchangeId;
  side: Side;
} {
  if (!leg) {
    throw new Error(name + " is required");
  }

  return {
    exchange: normalizeExchangeId(leg.exchange),
    side: normalizeSide(leg.side)
  };
}

function normalizeExchangeId(exchange: string): ExchangeId {
  if (SUPPORTED_EXCHANGES.includes(exchange as ExchangeId)) {
    return exchange as ExchangeId;
  }

  throw new Error("Unsupported paper exchange: " + exchange);
}

function normalizeSide(side: string): Side {
  if (side === "long" || side === "short") {
    return side;
  }

  throw new Error("Unsupported paper side: " + side);
}

function applyEntrySlippage(
  side: Side,
  markPrice: number,
  slippageBps: number
): number {
  return side === "long"
    ? markPrice * (1 + slippageBps / 10000)
    : markPrice * (1 - slippageBps / 10000);
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

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(name + " must be greater than 0.");
  }
}

function assertNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(name + " must be greater than or equal to 0.");
  }
}

function requireNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(name + " is required");
  }

  return value.trim();
}

function createId(prefix: string, time: number, index: number): string {
  return prefix + "-" + time + "-" + index + "-" + Math.random().toString(36).slice(2, 10);
}
