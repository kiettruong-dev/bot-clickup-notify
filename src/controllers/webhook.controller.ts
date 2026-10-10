import express from 'express';
import { handleEvent } from '../services/handle-event.service.ts';
import { ENV_CONFIG } from '../constants/index.contants.ts';

const { CLICKUP_API_TOKEN, CLICKUP_USER_ID, ZALO_BOT_TOKEN, ZALO_CHAT_IDS } = ENV_CONFIG;

export const handleWebhook = async (req: express.Request, res: express.Response) => {
  try {
    if (
      !CLICKUP_API_TOKEN ||
      !CLICKUP_USER_ID ||
      !ZALO_BOT_TOKEN ||
      ZALO_CHAT_IDS.length === 0
      ) {
        return res.status(500).json({
          ok: false,
          error: "Missing environment variables",
        });
      }

      if (!Buffer.isBuffer(req.body)) {
        return res.status(400).json({
          ok: false,
          error: "Expected raw JSON body",
        });
      }

      const event = JSON.parse(req.body.toString("utf8"));

      console.log("ClickUp event received:", event.event);

      await handleEvent(event);

      return res.status(200).json({ ok: true });
    } catch (error: any) {
      console.error("Webhook error:", error.response?.data || error.message);

      return res.status(500).json({
        ok: false,
        error: "Webhook processing failed",
      });
    }
}