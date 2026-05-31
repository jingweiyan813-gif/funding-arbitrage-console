import { useCallback, useEffect, useMemo, useState } from "react";
import {
  checkPaperLiquidations,
  closePaperPositions,
  fetchFundingSettlements,
  fetchOpenPaperPositions,
  fetchPaperAccount,
  fetchPaperLedger,
  fetchPaperPositions,
  fetchPaperTrades,
  openPaperPosition,
  refreshPaperPrices,
  resetPaperAccount,
  settlePaperFunding
} from "../api/client";
import { AccountSummary } from "../components/AccountSummary";
import { FormField } from "../components/FormField";
import { LedgerTable } from "../components/LedgerTable";
import { PaperControls } from "../components/PaperControls";
import { PositionCard } from "../components/PositionCard";
import type {
  FundingSettlement,
  LedgerEvent,
  PaperAccount,
  PaperPosition,
  PaperSeed,
  PaperTrade
} from "../types";

type PaperTradingScreenProps = {
  seed: PaperSeed | null;
};

export function PaperTradingScreen({ seed }: PaperTradingScreenProps) {
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [openPositions, setOpenPositions] = useState<PaperPosition[]>([]);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [fundingSettlements, setFundingSettlements] = useState<FundingSettlement[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [notional, setNotional] = useState("1000");
  const [leverage, setLeverage] = useState("3");
  const [slippageBps, setSlippageBps] = useState("5");
  const [feeRate, setFeeRate] = useState("0.0006");
  const [borrowRatePerDay, setBorrowRatePerDay] = useState("0.0002");
  const [holdingDays, setHoldingDays] = useState("1");
  const [basisPnl, setBasisPnl] = useState("0");
  const [isLoading, setIsLoading] = useState(true);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPaperData = useCallback(async () => {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const [accountData, positionData, openPositionData, tradeData, settlementData, ledgerData] =
        await Promise.all([
          fetchPaperAccount(),
          fetchPaperPositions(),
          fetchOpenPaperPositions(),
          fetchPaperTrades(),
          fetchFundingSettlements(),
          fetchPaperLedger()
        ]);
      setAccount(accountData);
      setPositions(positionData);
      setOpenPositions(openPositionData);
      setTrades(tradeData);
      setFundingSettlements(settlementData);
      setLedger(ledgerData);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "无法加载模拟盘数据");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPaperData();
  }, [loadPaperData]);

  const selectedStrategyType = seed?.strategyType ?? "cross_exchange_perp";
  const isCashCarrySeed = selectedStrategyType === "cash_and_carry";

  const pairToClose = useMemo(() => findPairToClose(openPositions), [openPositions]);

  async function runAction(action: () => Promise<unknown>) {
    setErrorMessage(null);
    setIsWorking(true);

    try {
      await action();
      await loadPaperData();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "模拟盘操作失败");
    } finally {
      setIsWorking(false);
    }
  }

  function handleReset() {
    if (!window.confirm("确认重置模拟账户？这会清空持仓和账本。")) {
      return;
    }

    void runAction(() => resetPaperAccount());
  }

  function handleOpen() {
    if (!seed) {
      return;
    }

    void runAction(() =>
      openPaperPosition({
        symbol: seed.symbol,
        legA: seed.legA,
        legB: seed.legB,
        notional: Number(notional),
        leverage: Number(leverage),
        slippageBps: Number(slippageBps),
        feeRate: Number(feeRate),
        strategyType: selectedStrategyType,
        borrowRatePerDay: Number(borrowRatePerDay),
        holdingDays: Number(holdingDays),
        basisPnl: Number(basisPnl)
      })
    );
  }

  function handleClosePair() {
    if (pairToClose.length < 2) {
      return;
    }

    void runAction(() =>
      closePaperPositions({
        positionIds: pairToClose.map((position) => position.id)
      })
    );
  }

  function handleSettle() {
    const fundingTime = Date.now();

    void runAction(async () => {
      if (openPositions.length === 0) {
        await settlePaperFunding({ fundingTime });
        return;
      }

      await Promise.all(
        openPositions.map((position) =>
          settlePaperFunding({
            positionId: position.id,
            fundingTime,
            rate: 0.0001
          })
        )
      );
    });
  }

  return (
    <main className="scanner-screen">
      <section className="toolbar">
        <div>
          <span className="section-kicker">模拟盘</span>
          <h2>模拟盘 · Paper Trading</h2>
          <p className="section-copy">
            这是纸面交易模拟盘，不接 API Key、不连接真实账户、不执行真实下单。系统只使用虚拟账户和公开行情。
          </p>
        </div>
      </section>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {isLoading ? <div className="loading-state">正在加载模拟盘...</div> : null}

      <section className="demo-hint-card">
        <strong>演示前提示</strong>
        <p>建议演示前先点击「重置模拟账户」，将虚拟账户恢复到 10000 USDT，避免历史演示数据影响展示。</p>
        {account && account.equity !== 10000 ? (
          <span>当前账户包含历史模拟记录，如需从干净状态开始，请重置账户。</span>
        ) : null}
      </section>

      <AccountSummary account={account} />

      <section className="paper-panel">
        <div className="panel-heading">
          <h3>操作</h3>
          <span>{isWorking ? "处理中" : "模拟盘不接 API Key、不真实下单"}</span>
        </div>
        <PaperControls
          disabled={isWorking}
          onCheckLiquidations={() => void runAction(() => checkPaperLiquidations())}
          onRefresh={() => void loadPaperData()}
          onRefreshPrices={() => void runAction(() => refreshPaperPrices())}
          onReset={handleReset}
          onSettle={handleSettle}
        />
        <p className="paper-note paper-note--compact">当前手动结算使用演示费率，用于验证账本与资金费结算流程；真实结算将在后台按交易所返回费率处理。</p>
      </section>

      {seed ? (
        <section className="paper-panel">
          <div className="panel-heading">
            <h3>使用该机会模拟建仓</h3>
            <span>{seed.symbol}</span>
          </div>
          <p className="paper-note">成交价基于公开行情 markPrice / ticker fallback，若实时行情不可用，可能使用 fallback 数据用于演示。</p>
          <div className="strategy-type-callout">
            <strong>策略类型：{formatStrategyType(selectedStrategyType)}</strong>
            {isCashCarrySeed ? (
              <span>这是模拟现货腿 + 永续腿，不执行真实现货买卖或借币。</span>
            ) : (
              <span>沿用现有跨所永续双腿模拟流程。</span>
            )}
          </div>
          <div className="paper-opportunity-summary">
            <div>
              <strong>{seed.legA.exchange}</strong>
              <span>{seed.legA.side} · {formatPercent(seed.legA.rate, 4)}</span>
            </div>
            <div>
              <strong>{seed.legB.exchange}</strong>
              <span>{seed.legB.side} · {formatPercent(seed.legB.rate, 4)}</span>
            </div>
          </div>
          <div className="form-grid paper-open-form">
            <FormField label="名义本金" onChange={setNotional} type="number" value={notional} />
            <FormField label="杠杆" onChange={setLeverage} type="number" value={leverage} />
            <FormField label="滑点 bps" onChange={setSlippageBps} type="number" value={slippageBps} />
            <FormField label="手续费率" onChange={setFeeRate} type="number" value={feeRate} />
            {isCashCarrySeed ? (
              <>
                <FormField label="每日借币利率" onChange={setBorrowRatePerDay} type="number" value={borrowRatePerDay} />
                <FormField label="持有天数" onChange={setHoldingDays} type="number" value={holdingDays} />
                <FormField label="基差盈亏" onChange={setBasisPnl} type="number" value={basisPnl} />
              </>
            ) : null}
          </div>
          <button className="refresh-button paper-primary-action" disabled={isWorking} onClick={handleOpen} type="button">
            确认模拟建仓
          </button>
        </section>
      ) : null}

      <section className="paper-panel">
        <div className="panel-heading">
          <h3>当前持仓</h3>
          <button
            className="refresh-button"
            disabled={pairToClose.length < 2 || isWorking}
            onClick={handleClosePair}
            type="button"
          >
            平掉当前双腿
          </button>
        </div>
        {openPositions.length === 0 ? (
          <div className="empty-state">暂无模拟持仓，请从机会挖掘或标准教学选择机会后模拟建仓。</div>
        ) : (
          <div className="positions-grid">
            {openPositions.map((position) => (
              <PositionCard key={position.id} position={position} />
            ))}
          </div>
        )}
      </section>

      <section className="paper-panel">
        <div className="panel-heading">
          <h3>资金费结算记录</h3>
          <span>{fundingSettlements.length} 条</span>
        </div>
        {fundingSettlements.length === 0 ? (
          <div className="empty-state">暂无资金费结算记录。</div>
        ) : (
          <div className="table-scroll">
            <table className="paper-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>交易所</th>
                  <th>币种</th>
                  <th>费率</th>
                  <th>金额</th>
                </tr>
              </thead>
              <tbody>
                {fundingSettlements.map((settlement) => (
                  <tr key={settlement.id}>
                    <td>{new Date(settlement.createdAt).toLocaleString()}</td>
                    <td>{settlement.exchange}</td>
                    <td>{settlement.symbol}</td>
                    <td>{formatPercent(settlement.rate, 4)}</td>
                    <td className={settlement.amount >= 0 ? "positive" : "negative"}>
                      {settlement.amount.toFixed(8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="paper-panel">
        <div className="panel-heading">
          <h3>账本</h3>
          <span>{trades.length} 笔成交 / {positions.length} 条历史持仓</span>
        </div>
        <LedgerTable events={ledger} />
      </section>
    </main>
  );
}

function findPairToClose(positions: PaperPosition[]): PaperPosition[] {
  const openPositions = positions.filter((position) => position.status === "open");
  const sorted = [...openPositions].sort((a, b) => a.openedAt - b.openedAt);

  for (const position of sorted) {
    const pair = sorted.filter(
      (candidate) => candidate.symbol === position.symbol && candidate.openedAt === position.openedAt
    );
    if (pair.length >= 2) {
      return pair.slice(0, 2);
    }
  }

  return sorted.slice(0, 2);
}

function formatPercent(value: number, digits: number): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatStrategyType(strategyType: "cross_exchange_perp" | "cash_and_carry"): string {
  return strategyType === "cash_and_carry"
    ? "现货-永续 Cash-and-Carry"
    : "跨所永续";
}
