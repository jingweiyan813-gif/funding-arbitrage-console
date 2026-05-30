import { roundMoney } from "@funding-arbitrage-console/core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  FundingSettlement,
  PaperAccount,
  PaperPosition,
  Trade
} from "@funding-arbitrage-console/core";

export type LedgerEvent = {
  id: string;
  type: "trade" | "funding";
  time: number;
  title: string;
  amount: number;
  meta?: Record<string, unknown>;
};

export type SettlementCursor = {
  id: string;
  positionId: string;
  lastSettledAt: number;
};

export type PaperStore = {
  account: PaperAccount;
  positions: PaperPosition[];
  trades: Trade[];
  fundingSettlements: FundingSettlement[];
  settlementCursors: SettlementCursor[];
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "../../data");
const storePath = resolve(dataDir, "store.json");

function createDefaultStore(): PaperStore {
  return {
    account: {
      id: "paper-default",
      equity: 10000,
      baseCurrency: "USDT",
      realizedPnl: 0,
      totalFundingReceived: 0,
      totalFees: 0
    },
    positions: [],
    trades: [],
    fundingSettlements: [],
    settlementCursors: []
  };
}

export async function initializeStore(): Promise<void> {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(storePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      await saveStore(createDefaultStore());
      return;
    }

    throw error;
  }
}

export async function getStore(): Promise<PaperStore> {
  await initializeStore();
  const raw = await readFile(storePath, "utf8");
  return JSON.parse(raw) as PaperStore;
}

export async function saveStore(store: PaperStore): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
}

export async function getAccount(): Promise<PaperAccount> {
  const store = await getStore();
  return store.account;
}

export async function resetAccount(): Promise<PaperStore> {
  const store = createDefaultStore();
  await saveStore(store);
  return store;
}

export async function listPositions(): Promise<PaperPosition[]> {
  const store = await getStore();
  return store.positions;
}

export async function listOpenPositions(): Promise<PaperPosition[]> {
  const positions = await listPositions();
  return positions.filter((position) => position.status === "open");
}

export async function listTrades(): Promise<Trade[]> {
  const store = await getStore();
  return store.trades;
}

export async function listFundingSettlements(): Promise<FundingSettlement[]> {
  const store = await getStore();
  return store.fundingSettlements;
}

export async function listLedgerEvents(): Promise<LedgerEvent[]> {
  const store = await getStore();
  const tradeEvents = store.trades.map<LedgerEvent>((trade) => ({
    id: trade.id,
    type: "trade",
    time: trade.createdAt,
    title: trade.type + " " + trade.symbol,
    amount: roundMoney(trade.realizedPnl),
    meta: {
      accountId: trade.accountId,
      positionId: trade.positionId,
      exchange: trade.exchange,
      side: trade.side,
      price: trade.price,
      notional: trade.notional,
      fee: trade.fee,
      slippageCost: trade.slippageCost
    }
  }));
  const fundingEvents = store.fundingSettlements.map<LedgerEvent>(
    (settlement) => ({
      id: settlement.id,
      type: "funding",
      time: settlement.createdAt,
      title: "funding " + settlement.symbol,
      amount: roundMoney(settlement.amount),
      meta: {
        accountId: settlement.accountId,
        positionId: settlement.positionId,
        exchange: settlement.exchange,
        rate: settlement.rate
      }
    })
  );

  return [...tradeEvents, ...fundingEvents].sort((a, b) => b.time - a.time);
}


export async function updateAccount(account: PaperAccount): Promise<PaperAccount> {
  const store = await getStore();
  const nextStore: PaperStore = { ...store, account };
  await saveStore(nextStore);
  return account;
}

export async function addPositions(
  positions: PaperPosition[]
): Promise<PaperPosition[]> {
  const store = await getStore();
  const nextStore: PaperStore = {
    ...store,
    positions: [...store.positions, ...positions]
  };
  await saveStore(nextStore);
  return positions;
}

export async function updatePositions(
  positions: PaperPosition[]
): Promise<PaperPosition[]> {
  const store = await getStore();
  const positionById = new Map(
    positions.map((position) => [position.id, position] as const)
  );
  const nextStore: PaperStore = {
    ...store,
    positions: store.positions.map(
      (position) => positionById.get(position.id) ?? position
    )
  };
  await saveStore(nextStore);
  return positions;
}

export async function addTrades(trades: Trade[]): Promise<Trade[]> {
  const store = await getStore();
  const nextStore: PaperStore = {
    ...store,
    trades: [...store.trades, ...trades]
  };
  await saveStore(nextStore);
  return trades;
}

export async function getPositionsByIds(
  ids: string[]
): Promise<PaperPosition[]> {
  const store = await getStore();
  const idSet = new Set(ids);
  return store.positions.filter((position) => idSet.has(position.id));
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
