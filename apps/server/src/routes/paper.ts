import { Router, type NextFunction, type Request, type Response } from "express";
import {
  getAccount,
  listFundingSettlements,
  listLedgerEvents,
  listOpenPositions,
  listPositions,
  listTrades,
  resetAccount
} from "../data/store.js";

export const paperRouter = Router();

paperRouter.get(
  "/account",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const account = await getAccount();
      res.json({ ok: true, data: account });
    } catch (error) {
      next(error);
    }
  }
);

paperRouter.post(
  "/reset",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const store = await resetAccount();
      res.json({ ok: true, data: store });
    } catch (error) {
      next(error);
    }
  }
);

paperRouter.get(
  "/positions",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const positions = await listPositions();
      res.json({ ok: true, data: positions });
    } catch (error) {
      next(error);
    }
  }
);

paperRouter.get(
  "/positions/open",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const positions = await listOpenPositions();
      res.json({ ok: true, data: positions });
    } catch (error) {
      next(error);
    }
  }
);

paperRouter.get(
  "/trades",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const trades = await listTrades();
      res.json({ ok: true, data: trades });
    } catch (error) {
      next(error);
    }
  }
);

paperRouter.get(
  "/funding-settlements",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const settlements = await listFundingSettlements();
      res.json({ ok: true, data: settlements });
    } catch (error) {
      next(error);
    }
  }
);

paperRouter.get(
  "/ledger",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const ledgerEvents = await listLedgerEvents();
      res.json({ ok: true, data: ledgerEvents });
    } catch (error) {
      next(error);
    }
  }
);
