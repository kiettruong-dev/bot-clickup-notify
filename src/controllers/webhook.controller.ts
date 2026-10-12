import express from 'express';
import { handleEvent } from '../services/handle-event.service.ts';
import { ENV_CONFIG } from '../constants/index.contants.ts';
import { waitUntil } from '@vercel/functions';
import { handleReportMessage } from '../services/create-report.service.ts';
import { sendZaloTo } from '../services/zalo.service.ts';

const { CLICKUP_API_TOKEN, CLICKUP_USER_ID, ZALO_BOT_TOKEN, ZALO_CHAT_IDS, ZALO_WEBHOOK_SECRET } = ENV_CONFIG;

export const handleClickUpWebhook = async (req: express.Request, res: express.Response) => {
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
export const handleZaloWebhook = async (req: express.Request, res: express.Response) => {

    if (ZALO_WEBHOOK_SECRET && req.header("X-Bot-Api-Secret-Token") !== ZALO_WEBHOOK_SECRET) {
        return res.status(401).json({ status: "unauthorized" });
    }


    // Ack right away so Zalo doesn't retry. waitUntil keeps the serverless function alive until processing finishes
    // (without it Vercel freezes the function as soon as the response is sent).
    res.json({ status: "ok" });

    const result = req.body;
    const message = result?.message;
    if (result?.event_name !== "message.text.received" || !message?.text) return;
    if (message.chat?.chat_type && message.chat.chat_type !== "PRIVATE") return;

    const chatId = String(message.chat?.id ?? message.from?.id);
    waitUntil(
        handleReportMessage({
            chatId,
            userId: String(message.from?.id ?? chatId),
            userName: message.from?.display_name ?? "Unknown",
            text: message.text,
        }).catch(async (err) => {
            console.error("handle report failed:", err);
            await sendZaloTo(chatId, "Có lỗi khi ghi báo cáo, bạn thử lại sau nhé.").catch(() => {});
        }),
    );
};