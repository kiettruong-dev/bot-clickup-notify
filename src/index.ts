import express from "express";
import { handleWebhook } from "./controllers/webhook.controller.ts";
import { handleZaloWebhook } from "./controllers/zalo-webhook.controller.ts";

const app = express();

app.get("/", (_req, res) => {
  res.json({ ok: true, service: "clickup-zalo-notifier" });
});

app.get("/webhooks/clickup", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "ClickUp webhook endpoint is ready for POST requests",
  });
});

// Không đặt express.json() trước route này.
app.post(
  "/webhooks/clickup",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

app.post("/api/webhook/zalo", express.json(), handleZaloWebhook);

if (process.env.VERCEL !== "1") {
  const port = process.env.PORT || 3001;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
export default app;
