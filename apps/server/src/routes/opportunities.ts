import { Router } from "express";
import { getOpportunities } from "../services/scanner.js";
import type { OpportunitySort } from "../services/scanner.js";

export const opportunitiesRouter = Router();

opportunitiesRouter.get("/opportunities", async (req, res, next) => {
  try {
    const sort = parseSort(req.query.sort);
    const threshold = parseThreshold(req.query.threshold);
    const includeLowLiquidity = req.query.includeLowLiquidity === "true";
    const result = await getOpportunities({
      sort,
      threshold,
      includeLowLiquidity
    });

    res.json({
      ok: true,
      source: result.source,
      updatedAt: result.updatedAt,
      errors: result.errors,
      data: result.opportunities
    });
  } catch (error) {
    next(error);
  }
});

function parseSort(value: unknown): OpportunitySort | undefined {
  return value === "spread" || value === "netEdge" ? value : undefined;
}

function parseThreshold(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
