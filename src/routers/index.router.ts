import express from "express";
import { handleClickUpWebhook, handleZaloWebhook } from "../controllers/webhook.controller.ts";

const router = express.Router();

router.get("/webhooks/clickup", (_req, res) => {
  res.status(200).json({
    ok: true,
    message: "ClickUp webhook endpoint is ready for POST requests",
  });
});

// Không đặt express.json() trước route này.
router.post(
  "/webhooks/clickup",
  express.raw({ type: "application/json" }),
  handleClickUpWebhook,
);

router.post("/webhook/zalo", express.json(), handleZaloWebhook);

export default router;