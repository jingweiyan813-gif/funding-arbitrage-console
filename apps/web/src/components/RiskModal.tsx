import { useEffect, useState } from "react";

const storageKey = "funding-arbitrage-console-risk-ack";

export function RiskModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(window.localStorage.getItem(storageKey) !== "true");
  }, []);

  if (!open) {
    return null;
  }

  function close() {
    window.localStorage.setItem(storageKey, "true");
    setOpen(false);
  }

  return (
    <div className="risk-modal-backdrop" role="presentation">
      <section
        aria-labelledby="risk-modal-title"
        aria-modal="true"
        className="risk-modal"
        role="dialog"
      >
        <h2 id="risk-modal-title">风险确认</h2>
        <p>本工具仅用于学习和模拟，不构成投资建议。</p>
        <p>当前 Phase 1 不接入 API Key、不连接真实账户、不执行任何下单。</p>
        <p>
          资金费率套利并非稳赚，可能受到手续费、滑点、费率反转、爆仓和交易所风险影响。
        </p>
        <button onClick={close} type="button">
          我已理解
        </button>
      </section>
    </div>
  );
}
