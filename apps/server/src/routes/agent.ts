import { Router, type Request, type Response } from "express";
import {
  explainOpportunity,
  explainTrap,
  suggestSimulationPlan,
  summarizePaperState
} from "../services/coachAgent.js";

export const agentRouter = Router();

type AgentMode = "opportunity" | "trap" | "simulation_plan" | "paper_summary";

agentRouter.post("/explain", (req: Request, res: Response) => {
  const body = req.body as { mode?: AgentMode; payload?: Record<string, unknown> };
  const payload = body.payload ?? {};

  if (body.mode === "opportunity") {
    res.json({ ok: true, source: "rule_based", data: explainOpportunity(payload) });
    return;
  }

  if (body.mode === "trap") {
    res.json({ ok: true, source: "rule_based", data: explainTrap(payload) });
    return;
  }

  if (body.mode === "simulation_plan") {
    res.json({ ok: true, source: "rule_based", data: suggestSimulationPlan(payload) });
    return;
  }

  if (body.mode === "paper_summary") {
    res.json({ ok: true, source: "rule_based", data: summarizePaperState(payload) });
    return;
  }

  res.status(400).json({ ok: false, error: "Unsupported agent mode" });
});
