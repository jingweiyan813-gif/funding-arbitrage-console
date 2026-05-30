import { Router, type NextFunction, type Request, type Response } from "express";
import {
  closePaperPositionPair,
  openPaperArbitragePosition
} from "../services/paperTrading.js";
import {
  settleAllOpenPositions,
  settlePositionFunding
} from "../services/settlement.js";
import {
  checkAndLiquidatePositions,
  refreshOpenPositionsMarkPrice
} from "../services/markPriceWatcher.js";
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


paperRouter.post("/open", async (req: Request, res: Response) => {
  try {
    const result = await openPaperArbitragePosition(req.body);
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown paper open error"
    });
  }
});

paperRouter.post("/close", async (req: Request, res: Response) => {
  try {
    const result = await closePaperPositionPair(req.body);
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown paper close error"
    });
  }
});


paperRouter.post("/settle", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      positionId?: string;
      fundingTime?: number;
      rate?: number;
    };
    const result = body.positionId
      ? await settlePositionFunding({
          positionId: body.positionId,
          fundingTime: body.fundingTime,
          rate: body.rate
        })
      : await settleAllOpenPositions({ fundingTime: body.fundingTime });
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown paper settlement error"
    });
  }
});

paperRouter.post("/refresh-prices", async (_req: Request, res: Response) => {
  try {
    const result = await refreshOpenPositionsMarkPrice();
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown paper price refresh error"
    });
  }
});

paperRouter.post("/check-liquidations", async (_req: Request, res: Response) => {
  try {
    const result = await checkAndLiquidatePositions();
    res.json({ ok: true, data: result });
  } catch (error) {
    res.status(400).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown paper liquidation check error"
    });
  }
});
