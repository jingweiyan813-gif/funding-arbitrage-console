import OpenAI from "openai";

type AgentMode = "opportunity" | "trap" | "simulation_plan" | "paper_summary";
type CoachRiskLevel = "low" | "medium" | "high";
type CoachSource = "rule_based" | "llm";
type CoachProvider = "mimo" | "openai" | "openai_compatible";

type CoachResult = {
  title: string;
  summary: string;
  bullets: string[];
  riskLevel: CoachRiskLevel;
  nextActions: string[];
  disclaimer: string;
};

type CoachPayload = Record<string, unknown>;

type CoachAgentResponse = {
  source: CoachSource;
  provider?: CoachProvider;
  model?: string;
  warning?: string;
  data: CoachResult;
};

const DISCLAIMER = "仅用于学习和模拟，不构成投资建议。";
const DEFAULT_MIMO_BASE_URL = "https://api.xiaomimimo.com/v1";
const DEFAULT_MIMO_MODEL = "mimo-v2.5-pro";
const SYSTEM_PROMPT = [
  "你是一个资金费率套利教育教练 Agent。",
  "你只解释机会、风险和模拟建议。",
  "你不能给投资建议。",
  "你不能鼓励真实下单。",
  "你不能承诺收益。",
  "你必须提醒用户这是学习和模拟工具。",
  "你必须输出严格 JSON，不要输出 Markdown。"
].join("\\n");

let cachedClient: OpenAI | null = null;
let cachedBaseURL = "";
let cachedApiKey = "";

export function hasLlmConfig(): boolean {
  return Boolean(process.env.LLM_API_KEY?.trim());
}

export function getLlmClient(): OpenAI {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("LLM_API_KEY is not configured");
  }

  const baseURL = getLlmBaseUrl();
  if (!cachedClient || cachedBaseURL !== baseURL || cachedApiKey !== apiKey) {
    cachedClient = new OpenAI({ apiKey, baseURL });
    cachedBaseURL = baseURL;
    cachedApiKey = apiKey;
  }

  return cachedClient;
}

export function explainWithRuleBased(mode: AgentMode, payload: CoachPayload): CoachAgentResponse {
  return {
    source: "rule_based",
    data: runRuleBased(mode, payload)
  };
}

export async function explainWithLlm(mode: AgentMode, payload: CoachPayload): Promise<CoachAgentResponse> {
  const client = getLlmClient();
  const provider = getLlmProvider();
  const model = getLlmModel();
  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          mode,
          payload,
          outputSchema: {
            title: "string",
            summary: "string",
            bullets: "string[]",
            riskLevel: "low | medium | high",
            nextActions: "string[]",
            disclaimer: "string"
          }
        })
      }
    ],
    temperature: 0.2
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty LLM response");
  }

  return {
    source: "llm",
    provider,
    model,
    data: normalizeCoachResult(JSON.parse(extractJson(content)))
  };
}

export async function explainWithAgent(mode: AgentMode, payload: CoachPayload): Promise<CoachAgentResponse> {
  if (!hasLlmConfig()) {
    return explainWithRuleBased(mode, payload);
  }

  try {
    return await explainWithLlm(mode, payload);
  } catch {
    return {
      ...explainWithRuleBased(mode, payload),
      warning: "LLM unavailable, used rule-based fallback"
    };
  }
}

export function explainOpportunity(payload: CoachPayload): CoachResult {
  const riskLevel = assessRisk(payload);
  const symbol = getString(payload.symbol, "该机会");
  const bullets = buildBaseBullets(payload);

  bullets.unshift("先看净费差、可对冲性和流动性，再看原始费差。");

  return {
    title: "机会解释：" + symbol,
    summary: "这个规则教练会把机会拆成收益、成本、对冲和风险四层，帮助判断它是否适合进入模拟盘。",
    bullets,
    riskLevel,
    nextActions: [
      "先用收益计算确认扣费后是否仍为正。",
      "再用爆仓风险查看两条腿的安全垫。",
      "只在模拟盘中验证，不连接真实账户。"
    ],
    disclaimer: DISCLAIMER
  };
}

export function explainTrap(payload: CoachPayload): CoachResult {
  const bullets = buildBaseBullets(payload);
  bullets.unshift("费率极端不等于能套利，缺少对冲腿时，裸吃费率等于裸赌方向。");

  return {
    title: "陷阱解释",
    summary: "这类机会看起来费率很高，但风险来源可能不在费率本身，而在无法安全对冲、扣费后为负或单边行情过强。",
    bullets,
    riskLevel: "high",
    nextActions: [
      "不要直接模拟建仓 trap 机会。",
      "检查是否存在第二条可对冲腿。",
      "等待流动性、借贷可得性或净费差重新满足条件。"
    ],
    disclaimer: DISCLAIMER
  };
}

export function suggestSimulationPlan(payload: CoachPayload): CoachResult {
  const riskLevel = assessRisk(payload);
  const strategyType = getString(payload.strategyType, "cross_exchange_perp");
  const nextActions = strategyType === "cash_and_carry"
    ? [
        "使用较小 notional 先建一组模拟现货腿 + 永续腿。",
        "填写 borrowRatePerDay、holdingDays 和 basisPnl，观察借币成本对净收益的侵蚀。",
        "平仓后检查 Ledger 中是否记录 borrowCost。"
      ]
    : [
        "使用默认 notional = 1000 和 leverage = 3 建立双腿模拟仓。",
        "手动结算一次资金费，验证账本变化。",
        "刷新价格并检查强平风险，再平掉当前双腿。"
      ];

  return {
    title: "模拟计划",
    summary: "建议先用小仓位纸面交易验证收益、费用、滑点和强平风险，不把演示结果当成真实交易建议。",
    bullets: buildBaseBullets(payload),
    riskLevel,
    nextActions,
    disclaimer: DISCLAIMER
  };
}

export function summarizePaperState(payload: CoachPayload): CoachResult {
  const equity = getNumber(payload.equity);
  const realizedPnl = getNumber(payload.realizedPnl);
  const totalFees = getNumber(payload.totalFees);
  const totalFundingReceived = getNumber(payload.totalFundingReceived);
  const bullets = [
    equity === undefined ? "当前未提供账户权益。" : "当前模拟权益：" + formatMoney(equity) + " USDT。",
    realizedPnl === undefined ? "当前未提供已实现盈亏。" : "已实现盈亏：" + formatMoney(realizedPnl) + " USDT。",
    totalFundingReceived === undefined ? "当前未提供累计资金费。" : "累计资金费：" + formatMoney(totalFundingReceived) + " USDT。",
    totalFees === undefined ? "当前未提供累计手续费。" : "累计手续费：" + formatMoney(totalFees) + " USDT。"
  ];

  return {
    title: "模拟盘复盘总结",
    summary: "复盘重点是看资金费收入是否覆盖手续费、滑点、借币成本和强平风险，而不是只看毛收益。",
    bullets,
    riskLevel: realizedPnl !== undefined && realizedPnl < 0 ? "medium" : "low",
    nextActions: [
      "对照 Ledger 检查每一笔 trade 和 funding event。",
      "确认亏损是否来自手续费、滑点、借币成本或价格波动。",
      "下一轮模拟前先重置账户或记录初始权益。"
    ],
    disclaimer: DISCLAIMER
  };
}

function runRuleBased(mode: AgentMode, payload: CoachPayload): CoachResult {
  if (mode === "opportunity") return explainOpportunity(payload);
  if (mode === "trap") return explainTrap(payload);
  if (mode === "simulation_plan") return suggestSimulationPlan(payload);
  return summarizePaperState(payload);
}

function getLlmProvider(): CoachProvider {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (provider === "mimo") return "mimo";
  if (provider === "openai") return "openai";
  return "openai_compatible";
}

function getLlmBaseUrl(): string {
  const configured = process.env.LLM_BASE_URL?.trim();
  if (configured) return configured;
  return getLlmProvider() === "mimo" ? DEFAULT_MIMO_BASE_URL : "https://api.openai.com/v1";
}

function getLlmModel(): string {
  const configured = process.env.LLM_MODEL?.trim();
  if (configured) return configured;
  return getLlmProvider() === "mimo" ? DEFAULT_MIMO_MODEL : "gpt-4o-mini";
}

function normalizeCoachResult(value: unknown): CoachResult {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid LLM JSON");
  }
  const record = value as Record<string, unknown>;
  const riskLevel = getString(record.riskLevel);
  if (riskLevel !== "low" && riskLevel !== "medium" && riskLevel !== "high") {
    throw new Error("Invalid LLM riskLevel");
  }

  return {
    title: getRequiredString(record.title, "title"),
    summary: getRequiredString(record.summary, "summary"),
    bullets: getStringArray(record.bullets, "bullets"),
    riskLevel,
    nextActions: getStringArray(record.nextActions, "nextActions"),
    disclaimer: getRequiredString(record.disclaimer, "disclaimer")
  };
}

function extractJson(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  throw new Error("LLM response is not JSON");
}

function getRequiredString(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim()) return value;
  throw new Error("Invalid LLM field: " + field);
}

function getStringArray(value: unknown, field: string): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) return value;
  throw new Error("Invalid LLM field: " + field);
}

function assessRisk(payload: CoachPayload): CoachRiskLevel {
  if (getString(payload.category) === "trap") return "high";
  if (getBoolean(payload.fakeOpportunity) === true) return "high";
  const netEdge = getNumber(payload.netEdge);
  if (netEdge !== undefined && netEdge <= 0) return "high";
  const hedgeable = getNestedString(payload, ["hedgeability", "hedgeable"]);
  if (hedgeable === "conditional") return "medium";
  if (getString(payload.singleSidedStrength) === "severe") return "high";
  return "low";
}

function buildBaseBullets(payload: CoachPayload): string[] {
  const bullets: string[] = [];
  const netEdge = getNumber(payload.netEdge);
  if (netEdge !== undefined && netEdge <= 0) {
    bullets.push("扣费后为负，属于假机会，不能只看表面费差。");
  }
  if (getString(payload.strategyType) === "cash_and_carry") {
    bullets.push("这是现货-永续思路，需关注借币利息、基差变化和现货腿可得性。");
  }
  if (getString(payload.singleSidedStrength) === "severe") {
    bullets.push("单边行情剧烈，裸吃费率风险高。");
  }
  const hedgeable = getNestedString(payload, ["hedgeability", "hedgeable"]);
  if (hedgeable === "conditional") {
    bullets.push("可对冲性仍有条件，需要继续确认借贷、流动性或保证金风险。");
  }
  if (getString(payload.category) === "trap") {
    bullets.push("该候选被标记为陷阱，不建议进入模拟建仓。 ");
  }
  if (bullets.length === 0) {
    bullets.push("暂未发现明显红旗，但仍需要用模拟盘验证费用、滑点和强平风险。");
  }
  return bullets;
}

function getString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function getNestedString(payload: CoachPayload, path: string[]): string | undefined {
  let cursor: unknown = payload;
  for (const key of path) {
    if (!cursor || typeof cursor !== "object" || !(key in cursor)) {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return typeof cursor === "string" ? cursor : undefined;
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
