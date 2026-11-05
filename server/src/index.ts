import cors from "cors";
import express from "express";
import { scansRouter } from "./routes/scans";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true, service: "third-eye-server" }));
app.use("/scans", scansRouter);

// Last-resort error handler — never leak stack traces or provider details.
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { code: "PROVIDER_ERROR", message: "Analysis failed. Try again in a moment." } });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Third Eye server listening on :${port} (visual=${process.env.VISUAL_PROVIDER ?? "mock"}, voice=${process.env.VOICE_PROVIDER ?? "mock"})`);
});
