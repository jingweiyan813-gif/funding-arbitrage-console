export type Side = "long" | "short";

export type RiskLevel = "safe" | "warning" | "critical";

export type FundingLeg = {
  exchange: string;
  symbol: string;
  side: Side;
  rate: number;
  notional: number;
  feeRate: number;
};

export type FundingProfitInput = {
  legA: FundingLeg;
  legB: FundingLeg;
  cycles: number;
  intervalHours: number;
  slippageBps: number;
};

export type FundingProfitResult = {
  grossFunding: number;
  legAFunding: number;
  legBFunding: number;
  openFees: number;
  closeFees: number;
  totalFees: number;
  slippageCost: number;
  netProfit: number;
  breakEvenCycles: number | null;
  netApr: number;
};

export type LiquidationInput = {
  side: Side;
  markPrice: number;
  leverage: number;
  margin: number;
  maintMarginRate: number;
};

export type LiquidationResult = {
  liqPrice: number;
  distancePercent: number;
  riskLevel: RiskLevel;
  warning?: string;
};
