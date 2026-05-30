import { Router, type Request, type Response } from "express";
import { mineOpportunities } from "../services/opportunityMining.js";

export const miningRouter = Router();

miningRouter.get("/opportunities", async (req: Request, res: Response) => {
  try {
    const result = await mineOpportunities({
      threshold: parseNumber(req.query.threshold),
      limit: parseNumber(req.query.limit),
      includeTraps: req.query.includeTraps !== "false"
    });

    res.json({
      ok: true,
      source: result.source,
      updatedAt: result.updatedAt,
      errors: result.errors,
      data: result.data
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

function parseNumber(value: unknown): number | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
