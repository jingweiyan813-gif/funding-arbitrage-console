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

export type PaperPositionStatus = "open" | "closed" | "liquidated";

export type PaperAccount = {
  id: string;
  equity: number;
  baseCurrency: "USDT";
  realizedPnl: number;
  totalFundingReceived: number;
  totalFees: number;
};

export type PaperPosition = {
  id: string;
  accountId: string;
  exchange: string;
  symbol: string;
  side: Side;
  notional: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  maintMarginRate: number;
  liqPrice: number;
  status: PaperPositionStatus;
  openedAt: number;
  closedAt?: number;
};

export type Trade = {
  id: string;
  accountId: string;
  positionId: string;
  type: "open" | "close" | "liquidation";
  side: Side;
  symbol: string;
  exchange: string;
  price: number;
  notional: number;
  fee: number;
  slippageCost: number;
  realizedPnl: number;
  createdAt: number;
};

export type FundingSettlement = {
  id: string;
  accountId: string;
  positionId: string;
  symbol: string;
  exchange: string;
  rate: number;
  amount: number;
  createdAt: number;
};
