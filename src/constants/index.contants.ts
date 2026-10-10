export const URL_CLICKUP_API = "https://api.clickup.com/api/v2";
export const ENV_CONFIG = {
  CLICKUP_API_TOKEN: process.env.CLICKUP_API_TOKEN || "",
  CLICKUP_USER_ID: process.env.CLICKUP_USER_ID || "",
  ZALO_BOT_TOKEN: process.env.ZALO_BOT_TOKEN || "",
  ZALO_CHAT_IDS: (process.env.ZALO_CHAT_ID || "").split(",").map((id) => id.trim()).filter((id) => id.length > 0),
};
export const REPORT_ENV = {
  ZALO_WEBHOOK_SECRET: process.env.ZALO_WEBHOOK_SECRET || "",
  APPS_SCRIPT_URL: process.env.APPS_SCRIPT_URL || "",
  APPS_SCRIPT_SECRET: process.env.APPS_SCRIPT_SECRET || "",
};
