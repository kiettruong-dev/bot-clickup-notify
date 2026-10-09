import express from "express";
import crypto from "crypto";
import axios from "axios";

const app = express();

const {
  CLICKUP_API_TOKEN,
  CLICKUP_USER_ID,
  CLICKUP_WEBHOOK_SECRET,
  ZALO_BOT_TOKEN,
  ZALO_CHAT_ID,
} = process.env;

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
// Cần raw body để xác minh X-Signature chính xác.
app.post(
  "/webhooks/clickup",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (
        !CLICKUP_API_TOKEN ||
        !CLICKUP_USER_ID ||
        !CLICKUP_WEBHOOK_SECRET ||
        !ZALO_BOT_TOKEN ||
        !ZALO_CHAT_ID
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

      const signature = req.get("X-Signature");

      if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) {
        return res.status(401).json({
          ok: false,
          error: "Missing or invalid signature",
        });
      }

      const expected = crypto
        .createHmac("sha256", CLICKUP_WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex");

      const receivedBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expected, "hex");

      if (
        receivedBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
      ) {
        return res.status(401).json({
          ok: false,
          error: "Signature verification failed",
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

async function sendZalo(text: any) {
  const response = await axios.post(
    `https://bot-api.zaloplatforms.com/bot${ZALO_BOT_TOKEN}/sendMessage`,
    {
      chat_id: ZALO_CHAT_ID,
      text: text.slice(0, 3500),
    },
    { timeout: 8000 }
  );

  if (response.data?.ok === false) {
    throw new Error(
      `Zalo rejected message: ${JSON.stringify(response.data)}`
    );
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

// Quan trọng: export Express app, không gọi app.listen().
module.exports = app;