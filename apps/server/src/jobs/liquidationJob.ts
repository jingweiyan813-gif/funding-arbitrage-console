import {
  checkAndLiquidatePositions,
  refreshOpenPositionsMarkPrice
} from "../services/markPriceWatcher.js";

export function startLiquidationJob(intervalMs = 15000): () => void {
  const timer = setInterval(() => {
    refreshOpenPositionsMarkPrice()
      .then(() => checkAndLiquidatePositions())
      .catch((error: unknown) => {
        console.warn("Paper liquidation job failed", error);
      });
  }, intervalMs);

  return () => clearInterval(timer);
}
