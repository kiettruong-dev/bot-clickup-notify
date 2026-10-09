import express from "express";
import axios from "axios";

const app = express();

const {
  CLICKUP_API_TOKEN,
  CLICKUP_USER_ID,
  ZALO_BOT_TOKEN,
  ZALO_CHAT_ID,
} = process.env;

// ZALO_CHAT_ID có thể chứa nhiều ID, ngăn cách bằng dấu phẩy.
const ZALO_CHAT_IDS = (ZALO_CHAT_ID || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

// Kiểm tra domain và route.
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
// Đã tắt xác minh X-Signature.
app.post(
  "/webhooks/clickup",
  express.raw({ type: "application/json" }),
  async (req, res) => {
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
      console.error(
        "Webhook error:",
        error.response?.data || error.message
      );

      return res.status(500).json({
        ok: false,
        error: "Webhook processing failed",
      });
    }
  }
);

async function getTask(taskId: any) {
  const response = await axios.get(
    `https://api.clickup.com/api/v2/task/${encodeURIComponent(taskId)}`,
    {
      headers: { Authorization: CLICKUP_API_TOKEN },
      timeout: 8000,
    }
  );

  return response.data;
}

async function sendZaloTo(chatId: string, text: string) {
  const response = await axios.post(
    `https://bot-api.zaloplatforms.com/bot${ZALO_BOT_TOKEN}/sendMessage`,
    {
      chat_id: chatId,
      text: text.slice(0, 3500),
    },
    { timeout: 8000 }
  );

  if (response.data?.ok === false) {
    throw new Error(
      `Zalo rejected message for ${chatId}: ${JSON.stringify(response.data)}`
    );
  }
}

async function sendZalo(text: string) {
  const results = await Promise.allSettled(
    ZALO_CHAT_IDS.map((chatId) => sendZaloTo(chatId, text))
  );

  const failed = results.filter(
    (r): r is PromiseRejectedResult => r.status === "rejected"
  );

  failed.forEach((r) =>
    console.error("Zalo send error:", r.reason?.response?.data || r.reason?.message)
  );

  // Chỉ báo lỗi khi gửi thất bại tới tất cả chat.
  if (failed.length === results.length) {
    throw new Error("Failed to send Zalo message to all chats");
  }
}

function taskUrl(task: any) {
  return task.url ||
    `https://app.clickup.com/t/${task.id}`;
}

async function handleEvent(event: any) {
  const taskId = event.task_id;

  if (!taskId) {
    console.log("Ignored event without task_id");
    return;
  }

  const history = event.history_items || [];

  // 1. Có người assign bạn vào task.
  if (event.event === "taskAssigneeUpdated") {
    const assignedToMe = history.some((item: any) =>
      item.field === "assignee_add" &&
      String(item.after?.id) === String(CLICKUP_USER_ID)
    );

    if (!assignedToMe) return;

    const task = await getTask(taskId);

    await sendZalo(
      `🔔 BẠN ĐƯỢC ASSIGN TASK\n\n` +
      `📌 ${task.name}\n` +
      `📊 Trạng thái: ${task.status?.status || "Chưa rõ"}\n` +
      `⚡ Ưu tiên: ${task.priority?.priority || "Chưa đặt"}\n\n` +
      `🔗 ${taskUrl(task)}`
    );

    return;
  }

  // 2. Có comment mới trong task được giao cho bạn.
  if (event.event === "taskCommentPosted") {
    const task = await getTask(taskId);

    const assignedToMe = (task.assignees || []).some(
      (user: any) => String(user.id) === String(CLICKUP_USER_ID)
    );

    if (!assignedToMe) return;

    for (const item of history) {
      if (item.field !== "comment") continue;

      const comment = item.comment?.text_content ||
        (item.comment?.comment || [])
          .map((part: any) => part.text || "")
          .join("")
          .trim();

      const author =
        item.comment?.user?.username ||
        item.user?.username ||
        "ClickUp user";

      await sendZalo(
        `💬 COMMENT MỚI TRONG TASK CỦA BẠN\n\n` +
        `📌 ${task.name}\n` +
        `👤 Người comment: ${author}\n` +
        `📝 Nội dung: ${comment || "(Không có nội dung văn bản)"}\n\n` +
        `🔗 ${taskUrl(task)}`
      );
    }

    return;
  }

  console.log("Ignored event:", event.event);
}

if (process.env.VERCEL !== "1") {
    const port = process.env.PORT || 3001;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
}
// Quan trọng: export Express app, không gọi app.listen().
export default app;