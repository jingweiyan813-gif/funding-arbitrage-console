import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchOpenPaperPositions } from "../api/client";
import type { PaperPosition } from "../types";

type MonitorAlertLevel = "critical" | "warning" | "info";

type MonitorAlert = {
  id: string;
  level: MonitorAlertLevel;
  type: string;
  symbol: string;
  exchange: string;
  message: string;
  time: number;
};

export function MonitorScreen() {
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  const loadPositions = useCallback(async (mode: "initial" | "refresh" = "refresh") => {
    setErrorMessage(null);
    if (mode === "initial") {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const data = await fetchOpenPaperPositions();
      setPositions(data);
      setLastUpdatedAt(Date.now());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "无法加载模拟持仓监控数据");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadPositions("initial");
  }, [loadPositions]);

  const alerts = useMemo(() => buildAlerts(positions, lastUpdatedAt ?? Date.now()), [lastUpdatedAt, positions]);
  const unreadAlerts = alerts.filter((alert) => !readAlertIds.has(alert.id));
  const criticalCount = unreadAlerts.filter((alert) => alert.level === "critical").length;
  const warningCount = unreadAlerts.filter((alert) => alert.level === "warning").length;
  const infoCount = unreadAlerts.filter((alert) => alert.level === "info").length;

  function markAllRead() {
    setReadAlertIds(new Set(alerts.map((alert) => alert.id)));
  }

  return (
    <main className="scanner-screen monitor-screen">
      <section className="dashboard-hero monitor-hero">
        <div>
          <span className="section-kicker">Phase 3 Preview</span>
          <h2>监控 / 告警</h2>
          <p>
            这是轻量本地监控页面，用现有模拟持仓生成演示级告警。不接 API Key、不连接真实账户、不使用 WebSocket、不发送外部通知。
          </p>
        </div>
        <div className="monitor-actions">
          <button className="refresh-button" disabled={isRefreshing} onClick={() => void loadPositions()} type="button">
            {isRefreshing ? "刷新中..." : "刷新监控"}
          </button>
          <button className="secondary-button" disabled={alerts.length === 0} onClick={markAllRead} type="button">
            标记全部已读
          </button>
        </div>
      </section>

      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
      {isLoading ? <div className="loading-state">正在加载监控数据...</div> : null}

      <section className="monitor-summary-grid">
        <MonitorMetric label="告警总数" value={unreadAlerts.length} />
        <MonitorMetric label="Critical" level="critical" value={criticalCount} />
        <MonitorMetric label="Warning" level="warning" value={warningCount} />
        <MonitorMetric label="Info" level="info" value={infoCount} />
      </section>

      <section className="monitor-panel">
        <div className="panel-heading">
          <h3>告警列表</h3>
          <span>{lastUpdatedAt ? "更新时间：" + new Date(lastUpdatedAt).toLocaleString() : "等待刷新"}</span>
        </div>
        {positions.length === 0 ? (
          <div className="empty-state">暂无 open 模拟持仓。请先从机会挖掘或标准教学进入模拟盘建仓。</div>
        ) : unreadAlerts.length === 0 ? (
          <div className="empty-state">当前没有未读告警。已读告警可通过刷新监控重新生成。</div>
        ) : (
          <div className="table-scroll">
            <table className="paper-table monitor-table">
              <thead>
                <tr>
                  <th>级别</th>
                  <th>类型</th>
                  <th>symbol</th>
                  <th>exchange</th>
                  <th>说明</th>
                  <th>时间</th>
                </tr>
              </thead>
              <tbody>
                {unreadAlerts.map((alert) => (
                  <tr className={"monitor-alert-row monitor-alert-row--" + alert.level} key={alert.id}>
                    <td><span className={"monitor-level monitor-level--" + alert.level}>{alert.level}</span></td>
                    <td>{alert.type}</td>
                    <td>{alert.symbol}</td>
                    <td>{alert.exchange}</td>
                    <td>{alert.message}</td>
                    <td>{new Date(alert.time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function MonitorMetric({ label, value, level }: { label: string; value: number; level?: MonitorAlertLevel }) {
  return (
    <article className={"monitor-metric-card " + (level ? "monitor-metric-card--" + level : "")}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function buildAlerts(positions: PaperPosition[], time: number): MonitorAlert[] {
  return positions.flatMap((position) => {
    const alerts: MonitorAlert[] = [];
    const prefix = position.id + "-" + time;

    if (position.status === "liquidated") {
      alerts.push({
        id: prefix + "-liquidated",
        level: "critical",
        type: "已有强平记录",
        symbol: position.symbol,
        exchange: position.exchange,
        message: "该模拟持仓已被标记为 liquidated，需要复盘强平触发条件。",
        time
      });
    }

    const unrealizedPnl = position.unrealizedPnl ?? 0;
    if (unrealizedPnl < 0 && Math.abs(unrealizedPnl) > position.notional * 0.05) {
      alerts.push({
        id: prefix + "-large-loss",
        level: "warning",
        type: "浮亏较大",
        symbol: position.symbol,
        exchange: position.exchange,
        message: "当前浮亏约 " + formatMoney(Math.abs(unrealizedPnl)) + " USDT，已超过名义本金的 5%。",
        time
      });
    }

    const liquidationAlert = getLiquidationAlert(position);
    if (liquidationAlert) {
      alerts.push({
        id: prefix + "-liquidation-distance",
        level: liquidationAlert.level,
        type: "接近强平",
        symbol: position.symbol,
        exchange: position.exchange,
        message: liquidationAlert.message,
        time
      });
    }

    if (position.strategyType === "cash_and_carry") {
      alerts.push({
        id: prefix + "-cash-carry",
        level: "info",
        type: "Cash-and-Carry 观察",
        symbol: position.symbol,
        exchange: position.exchange,
        message: "该持仓属于现货-永续模拟策略，需关注借币成本、基差变化和可对冲性变化。",
        time
      });
    }

    return alerts;
  });
}

function getLiquidationAlert(position: PaperPosition): { level: MonitorAlertLevel; message: string } | null {
  if (position.legType === "spot" || position.liqPrice <= 0 || position.markPrice <= 0) {
    return null;
  }

  const distancePercent = position.side === "long"
    ? ((position.markPrice - position.liqPrice) / position.markPrice) * 100
    : ((position.liqPrice - position.markPrice) / position.markPrice) * 100;

  if (distancePercent < 5) {
    return {
      level: "critical",
      message: "距离强平价约 " + distancePercent.toFixed(2) + "% ，安全垫过低。"
    };
  }

  if (distancePercent < 10) {
    return {
      level: "warning",
      message: "距离强平价约 " + distancePercent.toFixed(2) + "% ，建议降低杠杆或补充缓冲。"
    };
  }

  return null;
}

function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 8 });
}
