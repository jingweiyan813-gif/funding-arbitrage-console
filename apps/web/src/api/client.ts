import type { FundingRatesResponse, OpportunitiesResponse } from "../types";

type OpportunitiesParams = {
  sort: "spread" | "netEdge";
  threshold?: number;
  includeLowLiquidity?: boolean;
};

type FundingRatesParams = {
  includeLowLiquidity?: boolean;
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

async function request<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network error";
    throw new Error(`请求失败：${message}`);
  }

  if (!response.ok) {
    throw new Error(`请求失败：HTTP ${response.status}`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("请求失败：响应不是有效 JSON");
  }
}
