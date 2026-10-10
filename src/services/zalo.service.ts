import axios from "axios";
import { ENV_CONFIG } from "../constants/index.contants.ts";

const { ZALO_BOT_TOKEN, ZALO_CHAT_IDS } = ENV_CONFIG;

export const sendZaloTo = async (chatId: string, text: string) => {
  const response = await axios.post(
    `https://bot-api.zaloplatforms.com/bot${ZALO_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: text.slice(0, 3500),
      parse_mode: "markdown",
    },
    { timeout: 8000 },
  );

  if (response.data?.ok === false) {
    throw new Error(
      `Zalo rejected message for ${chatId}: ${JSON.stringify(response.data)}`,
    );
  }
}

export const sendZalo = async (text: string) => {
  const results = await Promise.allSettled(
    ZALO_CHAT_IDS.map((chatId) => sendZaloTo(chatId, text)),
  );

  const failed = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );

  failed.forEach((r) =>
    console.error(
      "Zalo send error:",
      r.reason?.response?.data || r.reason?.message,
    ),
  );

  if (failed.length === results.length) {
    throw new Error("Failed to send Zalo message to all chats");
  }
}