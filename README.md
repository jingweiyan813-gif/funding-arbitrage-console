# Funding Arbitrage Console

Funding Arbitrage Console 是一个 Phase 1 演示版资金费率套利工作台。它把“发现机会 -> 计算净收益 -> 查看爆仓风险”放在同一个界面里，帮助用户理解资金费率套利并不只看费差，也要同时看手续费、滑点、流动性和强平风险。

## 当前版本范围

当前版本只覆盖 Phase 1：公开行情扫描、纯计算层、前端演示和教育层。

## 当前已实现

- Scanner：展示跨交易所资金费率机会、数据来源、错误状态、假机会和排序。
- Calculator：基于 `packages/core` 计算资金费毛收益、手续费、滑点、净收益和净年化。
- Liquidation：基于 `packages/core` 计算两条腿的强平价、安全垫和风险等级。
- Education Layer：提供 Scanner、Calculator、Liquidation 三屏教育说明、术语 tooltip 和首次风险弹窗。

## 当前不实现

- API Key
- 真实账户
- 真实下单
- 数据库
- WebSocket
- 模拟账户 / 账本
- 通知中心

## 技术栈

- npm workspaces monorepo
- React + Vite + TypeScript
- Node + Express + TypeScript
- CCXT 公开接口
- packages/core 纯 TypeScript 计算包
- Vitest

## 目录结构

```text
.
├─ apps/
│  ├─ web/       # 前端 dashboard
│  └─ server/    # Express API 和 CCXT public scanner
├─ packages/
│  └─ core/      # 纯计算函数和单元测试
├─ package.json
└─ tsconfig.base.json
```

## 安装方式

```bash
npm install
```

## 启动方式

```bash
npm run dev
```

默认地址：

- Web: `http://localhost:5173`
- Server: `http://localhost:3001`

## 测试方式

```bash
npm test
```

## 构建方式

```bash
npm run build
```


## 本地生产构建

生产模式由 Express 同时提供 `/api/*` 接口和 `apps/web/dist` 前端静态文件，非 `/api` 路由会 fallback 到 `index.html`。

```bash
npm install
npm run build
npm start
```

启动后访问：

- Frontend: `http://localhost:3001`
- Health API: `http://localhost:3001/api/health`
- Opportunities API: `http://localhost:3001/api/opportunities`

`PORT` 可用于覆盖生产服务端口：

```bash
PORT=8080 npm start
```

## Render 部署

Render Web Service 参数：

- Runtime: Node
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variable: `PORT` 由 Render 自动注入，应用会读取 `process.env.PORT`

## API 列表

- `GET /api/health`
- `GET /api/funding-rates?includeLowLiquidity=true|false`
- `GET /api/opportunities?sort=spread|netEdge&threshold=number&includeLowLiquidity=true|false`

## 演示路径

1. 打开首页。
2. 查看 Scanner 机会排行榜。
3. 切换按费差排序 / 按净费差排序。
4. 找一个 `fakeOpportunity`，说明“费差最大不等于利润最大”。
5. 点击“去计算”。
6. 查看毛资金费、手续费、滑点、净收益。
7. 回到 Scanner，点击“看爆仓”。
8. 查看两腿强平价和安全垫。
9. 解释：资金费率套利不是稳赚，核心是收益和风险同时可见。

## 风险声明

本工具仅用于学习和模拟，不构成投资建议。当前 Phase 1 不接入 API Key、不连接真实账户、不执行任何下单。资金费率套利并非稳赚，可能受到手续费、滑点、费率反转、爆仓和交易所风险影响。
