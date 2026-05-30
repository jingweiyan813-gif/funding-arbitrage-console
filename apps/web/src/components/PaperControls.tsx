type PaperControlsProps = {
  onRefresh: () => void;
  onReset: () => void;
  onRefreshPrices: () => void;
  onSettle: () => void;
  onCheckLiquidations: () => void;
  disabled?: boolean;
};

export function PaperControls({
  onRefresh,
  onReset,
  onRefreshPrices,
  onSettle,
  onCheckLiquidations,
  disabled = false
}: PaperControlsProps) {
  return (
    <div className="paper-controls">
      <button disabled={disabled} onClick={onRefresh} type="button">刷新账户</button>
      <button disabled={disabled} onClick={onRefreshPrices} type="button">手动刷新价格</button>
      <button disabled={disabled} onClick={onSettle} type="button">手动结算资金费</button>
      <button disabled={disabled} onClick={onCheckLiquidations} type="button">手动检查强平</button>
      <button className="danger-button" disabled={disabled} onClick={onReset} type="button">
        重置模拟账户
      </button>
    </div>
  );
}
