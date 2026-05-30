import express, { type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { fundingRouter } from "./routes/funding.js";
import { healthRouter } from "./routes/health.js";
import { opportunitiesRouter } from "./routes/opportunities.js";

const app = express();
const port = process.env.PORT || 3001;
const __dirname = dirname(fileURLToPath(import.meta.url));
const webDistPath = resolve(__dirname, "../../web/dist");
const webIndexPath = resolve(webDistPath, "index.html");

app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", fundingRouter);
app.use("/api", opportunitiesRouter);

if (process.env.NODE_ENV === "production" && existsSync(webIndexPath)) {
  app.use(express.static(webDistPath));
  app.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
    res.sendFile(webIndexPath);
  });
}

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
