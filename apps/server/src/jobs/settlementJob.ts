import { settleAllOpenPositions } from "../services/settlement.js";

export function startSettlementJob(intervalMs = 30000): () => void {
  const timer = setInterval(() => {
    settleAllOpenPositions().catch((error: unknown) => {
      console.warn("Paper settlement job failed", error);
    });
  }, intervalMs);

  return () => clearInterval(timer);
}
