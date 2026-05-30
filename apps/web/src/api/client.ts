import type {
  FundingRatesResponse,
  MiningResponse,
  FundingSettlement,
  LedgerEvent,
  OpportunitiesResponse,
  PaperAccount,
  PaperPosition,
  PaperTrade,
  Side,
  StrategyType
} from "../types";

type OpportunitiesParams = {
  sort: "spread" | "netEdge";
  threshold?: number;
  includeLowLiquidity?: boolean;
};

type FundingRatesParams = {
  includeLowLiquidity?: boolean;
};

type MiningParams = {
  threshold?: number;
  limit?: number;
  includeTraps?: boolean;
};

export async function fetchOpportunities(
  params: OpportunitiesParams
): Promise<OpportunitiesResponse> {
  const searchParams = new URLSearchParams({
    sort: params.sort
  });

  if (params.threshold !== undefined) {
    searchParams.set("threshold", String(params.threshold));
  }

  if (params.includeLowLiquidity !== undefined) {
    searchParams.set(
      "includeLowLiquidity",
      String(params.includeLowLiquidity)
    );
  }

  return request<OpportunitiesResponse>(`/api/opportunities?${searchParams}`);
}

export async function fetchMiningOpportunities(
  params: MiningParams = {}
): Promise<MiningResponse> {
  const searchParams = new URLSearchParams();

  if (params.threshold !== undefined) {
    searchParams.set("threshold", String(params.threshold));
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.includeTraps !== undefined) {
    searchParams.set("includeTraps", String(params.includeTraps));
  }

  const query = searchParams.toString();
  return request<MiningResponse>(
    `/api/mining/opportunities${query ? `?${query}` : ""}`
  );
}

export async function fetchFundingRates(
  params: FundingRatesParams = {}
): Promise<FundingRatesResponse> {
  const searchParams = new URLSearchParams();

  if (params.includeLowLiquidity !== undefined) {
    searchParams.set(
      "includeLowLiquidity",
      String(params.includeLowLiquidity)
    );
  }

  const query = searchParams.toString();
  return request<FundingRatesResponse>(
    `/api/funding-rates${query ? `?${query}` : ""}`
  );
}

type ApiResponse<T> = {
  ok: boolean;
  data: T;
  error?: string;
};

type OpenPaperPositionPayload = {
  symbol: string;
  legA: { exchange: string; side: Side; rate?: number };
  legB: { exchange: string; side: Side; rate?: number };
  notional?: number;
  leverage?: number;
  marginPerLeg?: number;
  feeRate?: number;
  slippageBps?: number;
  maintMarginRate?: number;
  strategyType?: StrategyType;
  borrowRatePerDay?: number;
  holdingDays?: number;
  basisPnl?: number;
};

type ClosePaperPositionsPayload = {
  positionIds: string[];
  feeRate?: number;
  slippageBps?: number;
};

type SettlePaperFundingPayload = {
  positionId?: string;
  fundingTime?: number;
  rate?: number;
};

export async function fetchPaperAccount(): Promise<PaperAccount> {
  return requestData<PaperAccount>("/api/paper/account");
}

export async function resetPaperAccount() {
  return requestData<{
    account: PaperAccount;
    positions: PaperPosition[];
    trades: PaperTrade[];
    fundingSettlements: FundingSettlement[];
  }>("/api/paper/reset", { method: "POST" });
}

export async function fetchPaperPositions(): Promise<PaperPosition[]> {
  return requestData<PaperPosition[]>("/api/paper/positions");
}

export async function fetchOpenPaperPositions(): Promise<PaperPosition[]> {
  return requestData<PaperPosition[]>("/api/paper/positions/open");
}

export async function fetchPaperTrades(): Promise<PaperTrade[]> {
  return requestData<PaperTrade[]>("/api/paper/trades");
}

export async function fetchFundingSettlements(): Promise<FundingSettlement[]> {
  return requestData<FundingSettlement[]>("/api/paper/funding-settlements");
}

export async function fetchPaperLedger(): Promise<LedgerEvent[]> {
  return requestData<LedgerEvent[]>("/api/paper/ledger");
}

export async function openPaperPosition(payload: OpenPaperPositionPayload) {
  return requestData<{
    account: PaperAccount;
    positions: PaperPosition[];
    trades: PaperTrade[];
  }>("/api/paper/open", jsonRequest(payload));
}

export async function closePaperPositions(payload: ClosePaperPositionsPayload) {
  return requestData<{
    account: PaperAccount;
    positions: PaperPosition[];
    trades: PaperTrade[];
  }>("/api/paper/close", jsonRequest(payload));
}

export async function settlePaperFunding(payload: SettlePaperFundingPayload = {}) {
  return requestData<unknown>("/api/paper/settle", jsonRequest(payload));
}

export async function refreshPaperPrices() {
  return requestData<unknown>("/api/paper/refresh-prices", { method: "POST" });
}

export async function checkPaperLiquidations() {
  return requestData<unknown>("/api/paper/check-liquidations", { method: "POST" });
}

async function requestData<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await request<ApiResponse<T>>(url, init);

  if (!response.ok) {
    throw new Error(response.error ?? "请求失败：paper API 返回错误");
  }

  return response.data;
}

function jsonRequest(payload: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new Error(`请求失败：${message}`);
  }

  if (!response.ok) {
    let message = `请求失败：HTTP ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the HTTP status message when the error body is not JSON.
    }
    throw new Error(message);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("请求失败：响应不是有效 JSON");
  }
}
