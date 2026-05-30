export function calculateNotional(
  availableA: number,
  availableB: number,
  leverage: number
): number {
  if (availableA < 0) {
    throw new Error("availableA must be greater than or equal to 0");
  }

  if (availableB < 0) {
    throw new Error("availableB must be greater than or equal to 0");
  }

  if (leverage <= 0) {
    throw new Error("leverage must be greater than 0");
  }

  return Math.min(availableA, availableB) * leverage;
}

export function calculateContractQuantity(
  notional: number,
  price: number,
  contractSize: number
): number {
  if (notional < 0) {
    throw new Error("notional must be greater than or equal to 0");
  }

  if (price <= 0) {
    throw new Error("price must be greater than 0");
  }

  if (contractSize <= 0) {
    throw new Error("contractSize must be greater than 0");
  }

  return notional / price / contractSize;
}
