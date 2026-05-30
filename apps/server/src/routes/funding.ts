import { Router, type NextFunction, type Request, type Response } from "express";
import { getFundingRates } from "../services/scanner.js";

export const fundingRouter = Router();

fundingRouter.get(
  "/funding-rates",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const includeLowLiquidity = req.query.includeLowLiquidity === "true";
      const result = await getFundingRates({ includeLowLiquidity });

      res.json({
        ok: true,
        source: result.source,
        updatedAt: result.updatedAt,
        errors: result.errors,
        data: result.fundingRates
      });
    } catch (error) {
      next(error);
    }
  }
);
