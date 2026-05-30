# Funding Arbitrage Console

Funding Arbitrage Console 是一个 AI Agent 驱动的资金费率套利教育与模拟工作台，用于机会发现、风险解释、纸面交易和复盘，不连接真实账户、不真实下单。

## 在线 Demo

https://funding-arbitrage-console.onrender.com

## 当前功能模块

- 机会挖掘：全市场极端资金费率扫描，使用“真机会 / 有条件 / 陷阱”三色分区解释机会质量。
- 标准教学：在受控币池下展示资金费率套利样板，帮助理解费差、净费差和假机会。
- 收益计算：计算扣除手续费、滑点、借币成本后的净收益和净年化。
- 爆仓风险：展示双腿强平价、安全垫和风险等级。
- 模拟盘：提供虚拟账户、模拟建仓、模拟平仓、资金费结算和 Ledger。
- Cash-and-Carry：支持现货-永续模拟策略，并把借币利息作为模拟成本。
- 监控 / 告警：基于模拟持仓生成轻量本地风险提醒。
- AI 教练：解释机会、识别陷阱、生成模拟计划和复盘总结。

## AI Agent

AI 套利教练支持两层能力：

- 默认使用 rule-based fallback，不需要任何大模型 key。
- 配置 `LLM_API_KEY` 后启用大模型 Agent。
- 当前支持 OpenAI-compatible provider，小米 MiMo 已验证可用。
- LLM 调用失败或输出不是合法 JSON 时，会自动回退到 rule-based Agent。

环境变量示例：

```bash
LLM_PROVIDER=mimo
LLM_BASE_URL=https://api.xiaomimimo.com/v1
LLM_API_KEY=
LLM_MODEL=mimo-v2.5-pro
```

注意：

- 不要提交 `.env`。
- `LLM_API_KEY` 是大模型服务 key，不是交易所 key。
- Agent 不下单、不连接真实账户、不提供投资建议。

## 安全边界

- 不接交易所 API Key。
- 不连接真实账户。
- 不真实下单。
- 不调用交易所私有接口。
- 不提供投资建议。
- 所有交易都是 paper trading / 模拟。
- 真实行情仅通过公开接口读取。

## 技术栈

- React + Vite + TypeScript
- Node + Express + TypeScript
- CCXT 公开行情
- `packages/core` 纯计算包
- Vitest
- JSON store
- 小米 MiMo / OpenAI-compatible LLM Provider

## 目录结构

```text
.
├─ apps/
│  ├─ web/       # React dashboard
│  └─ server/    # Express API, scanner, paper trading, agent
├─ packages/
│  └─ core/      # 纯计算函数和单元测试
├─ package.json
└─ tsconfig.base.json
```

## 本地运行

安装依赖：

```bash
npm install
```

开发环境：

```bash
npm run dev
```

默认地址：

- Web: `http://localhost:5173`
- Server: `http://localhost:3001`

测试：

```bash
npm test
```

构建：

```bash
npm run build
```

生产模式：

```bash
npm start
```

生产模式下 Express 同时提供 `/api/*` 接口和 `apps/web/dist` 前端静态文件。

## 环境变量

复制示例文件：

```bash
cp .env.example .env
```

可选变量：

- `EXCHANGE_PROXY`：用于公开行情访问的代理，例如 `http://127.0.0.1:7890`。
- `LLM_PROVIDER`：大模型 provider，例如 `mimo` 或 `openai`。
- `LLM_BASE_URL`：OpenAI-compatible API base URL。
- `LLM_API_KEY`：大模型服务 key。
- `LLM_MODEL`：模型名，例如 `mimo-v2.5-pro`。

`.env` 不进 git；`.env.example` 只保留示例变量和占位，不包含真实 key。

## API 列表

- `GET /api/health`
- `GET /api/funding-rates?includeLowLiquidity=true|false`
- `GET /api/opportunities?sort=spread|netEdge&threshold=number&includeLowLiquidity=true|false`
- `GET /api/mining/opportunities?threshold=number&limit=number&includeTraps=true|false`
- `GET /api/paper/account`
- `POST /api/paper/reset`
- `GET /api/paper/positions`
- `GET /api/paper/positions/open`
- `GET /api/paper/trades`
- `GET /api/paper/funding-settlements`
- `GET /api/paper/ledger`
- `POST /api/paper/open`
- `POST /api/paper/close`
- `POST /api/paper/settle`
- `POST /api/paper/refresh-prices`
- `POST /api/paper/check-liquidations`
- `POST /api/agent/explain`

## 5 分钟演示路径

1. 打开在线 Demo 或本地首页。
2. 进入“机会挖掘”，展示全市场极端资金费率候选。
3. 解释“真机会 / 有条件 / 陷阱”三色分区：费率极端不等于能套利。
4. 点击 AI 教练，让 Agent 解释一个机会或陷阱。
5. 点击“去计算”，查看手续费、滑点、借币成本后的净收益。
6. 点击“看爆仓”，查看双腿强平价和安全垫。
7. 点击“模拟建仓”，进入 Paper Trading 建立纸面仓位。
8. 手动结算资金费，观察账户权益和 Ledger 变化。
9. 平掉当前双腿，在 Ledger 中查看 realizedPnl、totalFees、borrowCost 等记录。
10. 进入“监控 / 告警”，查看基于模拟持仓生成的风险提醒。
11. 回到 AI 教练，生成模拟计划或复盘总结。

## 当前未实现

- 真实账户接入。
- 真实下单。
- 交易所私有接口。
- 外部通知。
- WebSocket 实时推送。
- 多账户。
- 历史回测。

## Render 部署

Render Web Service 参数：

- Runtime: Node
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

Environment Variables：

- `LLM_PROVIDER`
- `LLM_BASE_URL`
- `LLM_API_KEY`
- `LLM_MODEL`

`PORT` 由 Render 自动注入，应用会读取 `process.env.PORT`。

## 最终验收命令

```bash
npm test
npm run build
```

curl 验收：

```bash
curl http://localhost:3001/api/health
curl 'http://localhost:3001/api/mining/opportunities?limit=10&includeTraps=true'
curl http://localhost:3001/api/paper/account
curl -X POST http://localhost:3001/api/agent/explain \
  -H 'Content-Type: application/json' \
  -d '{"mode":"opportunity","payload":{"symbol":"BTC/USDT:USDT","netEdge":0.0002,"strategyType":"cross_exchange_perp"}}'
```

## 风险声明

本工具仅用于学习和模拟，不构成投资建议。资金费率套利并非稳赚，可能受到手续费、滑点、费率反转、爆仓、借币成本、流动性和交易所风险影响。
