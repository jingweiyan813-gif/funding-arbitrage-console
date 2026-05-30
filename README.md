# Funding Arbitrage Console

Funding Arbitrage Console 是一个资金费率套利工作台演示项目。它把“发现机会 -> 计算净收益 -> 查看爆仓风险”放在同一个界面里，帮助用户理解资金费率套利并不只看费差，也要同时看手续费、滑点、流动性和强平风险。

## 当前版本范围

当前版本覆盖 Phase 1 + Phase 2 Paper Trading：公开行情扫描、纯计算层、前端教育演示，以及基于 JSON store 的纸面交易模拟盘。

## 当前已实现

- Scanner：展示跨交易所资金费率机会、数据来源、错误状态、假机会和排序。
- Calculator：基于 `packages/core` 计算资金费毛收益、手续费、滑点、净收益和净年化。
- Liquidation：基于 `packages/core` 计算两条腿的强平价、安全垫和风险等级。
- Education Layer：提供 Scanner、Calculator、Liquidation 三屏教育说明、术语 tooltip 和首次风险弹窗。
- Paper Trading：提供虚拟账户、模拟建仓、模拟平仓、手动资金费结算、手动价格刷新、手动强平检查、账本与资金费记录。

## 当前不实现

- 真实账户
- API Key
- 真实下单
- 交易所私有接口
- 数据库 / SQLite
- WebSocket
- 外部通知
- 多账户
- 历史回测

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


### Render React/JSX 类型说明

前端构建依赖 `@types/react`、`@types/react-dom`，并在 `apps/web/tsconfig.json` 中启用 `jsx: react-jsx` 与 DOM lib。`apps/web/src/vite-env.d.ts` 提供 Vite client 类型引用。


## Phase 2 Paper API 骨架

Phase 2 当前只加入模拟盘后端数据层和 API 骨架，不包含真实交易、不读取 API Key、不调用交易所私有接口。

- 当前使用 JSON store 持久化本地单用户模拟盘数据。
- 数据文件路径：`apps/server/data/store.json`。
- `apps/server/data/store.json` 不进 git，首次启动 server 时会自动生成。
- 默认账户：`paper-default`，初始权益 `10000 USDT`。
- 当前已提供 paper account 查询、reset、持仓/成交/资金费结算记录/账本查询 API。
- 当前已提供模拟建仓和平仓 API：`POST /api/paper/open`、`POST /api/paper/close`。
- 模拟成交价来自公开行情 markPrice / ticker fallback；仍不真实下单，仍不接 API Key。
- 当前已提供手动资金费结算 API：`POST /api/paper/settle`，使用 settlement cursor 保证同一 `positionId + fundingTime` 不重复结算。
- 当前已提供手动刷新价格 API：`POST /api/paper/refresh-prices`，会更新 open position 的 `markPrice` / `unrealizedPnl`。
- 当前已提供手动强平检查 API：`POST /api/paper/check-liquidations`。
- 后台轻量 jobs 会自动运行资金费结算和强平检查；这仍然只是 paper trading，不真实下单。
- 前端当前提供 Paper Trading tab，可查看虚拟账户、模拟建仓、模拟平仓、手动资金费结算、手动价格刷新和手动强平检查。
- Paper Trading 仍然不接 API Key，不真实下单。


## Phase 2 当前能力总结

已实现：

- JSON store 虚拟账户，默认 `10000 USDT`。
- 模拟建仓和模拟平仓。
- 手动资金费结算，并通过 settlement cursor 保证 `positionId + fundingTime` 幂等。
- 手动价格刷新，更新 open position 的 `markPrice` / `unrealizedPnl`。
- 自动 / 手动强平检查。
- Paper Trading 前端面板。
- 账本与资金费记录。

未实现：

- 真实账户。
- API Key。
- 真实下单。
- 交易所私有接口。
- 外部通知。
- WebSocket。
- 多账户。
- 历史回测。

## API 列表

- `GET /api/health`
- `GET /api/funding-rates?includeLowLiquidity=true|false`
- `GET /api/opportunities?sort=spread|netEdge&threshold=number&includeLowLiquidity=true|false`
- `GET /api/paper/account`
- `POST /api/paper/reset`
- `GET /api/paper/positions`
- `GET /api/paper/positions/open`
- `GET /api/paper/trades`
- `GET /api/paper/funding-settlements`
- `GET /api/paper/ledger`
- `POST /api/paper/check-liquidations`
- `POST /api/paper/refresh-prices`
- `POST /api/paper/settle`
- `POST /api/paper/close`
- `POST /api/paper/open`


## Phase 2 演示路径

1. 启动项目：`npm run dev`。
2. 打开首页，进入 Scanner。
3. 点击某个机会的“模拟建仓”。
4. 页面跳转到 Paper Trading。
5. 在模拟建仓确认卡片中点击“确认模拟建仓”。
6. 查看虚拟账户权益变化。
7. 查看两条 open positions。
8. 点击“手动结算资金费”。
9. 查看 funding settlements 和 ledger。
10. 点击“手动刷新价格”。
11. 点击“手动检查强平”。
12. 点击“平掉当前双腿”。
13. 查看 `realizedPnl`、`totalFees` 和 ledger。

## Phase 1 演示路径

1. 打开首页。
2. 查看 Scanner 机会排行榜。
3. 切换按费差排序 / 按净费差排序。
4. 找一个 `fakeOpportunity`，说明“费差最大不等于利润最大”。
5. 点击“去计算”。
6. 查看毛资金费、手续费、滑点、净收益。
7. 回到 Scanner，点击“看爆仓”。
8. 查看两腿强平价和安全垫。
9. 解释：资金费率套利不是稳赚，核心是收益和风险同时可见。


## Phase 2 curl 验收命令

```bash
# reset
curl -X POST http://localhost:3001/api/paper/reset

# open
curl -X POST http://localhost:3001/api/paper/open \
  -H 'Content-Type: application/json' \
  -d '{"symbol":"BTC/USDT:USDT","legA":{"exchange":"binance","side":"long"},"legB":{"exchange":"bybit","side":"short"},"notional":1000,"leverage":3}'

# positions
curl http://localhost:3001/api/paper/positions

# settle, replace POSITION_ID with an open position id
curl -X POST http://localhost:3001/api/paper/settle \
  -H 'Content-Type: application/json' \
  -d '{"positionId":"POSITION_ID","fundingTime":1700000000000,"rate":0.0001}'

# refresh-prices
curl -X POST http://localhost:3001/api/paper/refresh-prices

# check-liquidations
curl -X POST http://localhost:3001/api/paper/check-liquidations

# close, replace ids with two open position ids
curl -X POST http://localhost:3001/api/paper/close \
  -H 'Content-Type: application/json' \
  -d '{"positionIds":["POSITION_ID_A","POSITION_ID_B"]}'

# account
curl http://localhost:3001/api/paper/account

# ledger
curl http://localhost:3001/api/paper/ledger
```

## 风险声明

本工具仅用于学习和模拟，不构成投资建议。当前 Phase 1 不接入 API Key、不连接真实账户、不执行任何下单。资金费率套利并非稳赚，可能受到手续费、滑点、费率反转、爆仓和交易所风险影响。
