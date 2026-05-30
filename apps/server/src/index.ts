import express, { type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fundingRouter } from "./routes/funding.js";
import { healthRouter } from "./routes/health.js";
import { opportunitiesRouter } from "./routes/opportunities.js";
import { paperRouter } from "./routes/paper.js";
import { initializeStore } from "./data/store.js";

const app = express();
const port = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const webDistPath = resolve(__dirname, "../../web/dist");
const webIndexPath = resolve(webDistPath, "index.html");

app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", fundingRouter);
app.use("/api", opportunitiesRouter);
app.use("/api/paper", paperRouter);

if (process.env.NODE_ENV === "production" && existsSync(webIndexPath)) {
  app.use(express.static(webDistPath));
  app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
    res.sendFile(webIndexPath);
  });
}

await initializeStore();

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
