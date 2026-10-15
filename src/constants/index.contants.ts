export const URL_CLICKUP_API = "https://api.clickup.com/api/v2";
export const ENV_CONFIG = {
  CLICKUP_API_TOKEN: process.env.CLICKUP_API_TOKEN || "",
  CLICKUP_USER_ID: process.env.CLICKUP_USER_ID || "",
  ZALO_BOT_TOKEN: process.env.ZALO_BOT_TOKEN || "",
  ZALO_CHAT_IDS: [...new Set((process.env.ZALO_CHAT_ID || "").split(",").map((id) => id.trim()).filter((id) => id.length > 0))],
  ZALO_WEBHOOK_SECRET: process.env.ZALO_WEBHOOK_SECRET || "",
  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || "",
  APPS_SCRIPT_SECRET: process.env.APPS_SCRIPT_SECRET || "",
  ACCOUNT_VIEWERS: (process.env.ACCOUNT_VIEWERS || "").split(",").map((id) => id.trim()).filter((id) => id.length > 0),
};
export const USER_TABS: Record<string, number> = {
    f185798b9cc675982cd7: 1535048569, // Kiệt
    "3fc940c0408aa9d4f09b": 0,// Nam
};
