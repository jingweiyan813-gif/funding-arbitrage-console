import { Router, type Request, type Response } from "express";
import { explainWithAgent } from "../services/coachAgent.js";

export const agentRouter = Router();

type AgentMode = "opportunity" | "trap" | "simulation_plan" | "paper_summary";
const supportedModes = new Set<AgentMode>(["opportunity", "trap", "simulation_plan", "paper_summary"]);

agentRouter.post("/explain", async (req: Request, res: Response) => {
  const body = req.body as { mode?: AgentMode; payload?: Record<string, unknown> };

  if (!body.mode || !supportedModes.has(body.mode)) {
    res.status(400).json({ ok: false, error: "Unsupported agent mode" });
    return;
  }

  const result = await explainWithAgent(body.mode, body.payload ?? {});
  res.json({ ok: true, ...result });
});
