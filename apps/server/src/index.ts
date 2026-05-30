import express from "express";
import { fundingRouter } from "./routes/funding.js";
import { healthRouter } from "./routes/health.js";
import { opportunitiesRouter } from "./routes/opportunities.js";

const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(express.json());
app.use("/api", healthRouter);
app.use("/api", fundingRouter);
app.use("/api", opportunitiesRouter);

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
