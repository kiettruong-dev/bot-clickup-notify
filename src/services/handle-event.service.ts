import {ENV_CONFIG} from '../constants/index.contants.ts';
import { getTask, taskUrl } from './clickup.service.ts';
import { sendZalo } from './zalo.service.ts';
const { CLICKUP_USER_ID } = ENV_CONFIG;
export const handleEvent = async (event: any) => {
  const taskId = event.task_id;

  if (!taskId) {
    console.log("Ignored event without task_id");
    return;
  }

  const history = event.history_items || [];

  // 1. Có người assign bạn vào task.
  if (event.event === "taskAssigneeUpdated") {
    const assignedToMe = history.some(
      (item: any) =>
        item.field === "assignee_add" &&
        String(item.after?.id) === String(CLICKUP_USER_ID),
    );

    if (!assignedToMe) return;

    const task = await getTask(taskId);

    await sendZalo(
      `🔔 BẠN ĐƯỢC ASSIGN TASK\n\n` +
        `📌 ${task.name}\n` +
        `📊 Trạng thái: ${task.status?.status || "Chưa rõ"}\n` +
        `⚡ Ưu tiên: ${task.priority?.priority || "Chưa đặt"}\n\n` +
        `🔗 ${taskUrl(task)}`,
    );

    return;
  }

  // 2. Có comment mới trong task được giao cho bạn.
  if (event.event === "taskCommentPosted") {
    const task = await getTask(taskId);

    const assignedToMe = (task.assignees || []).some(
      (user: any) => String(user.id) === String(CLICKUP_USER_ID),
    );

    if (!assignedToMe) return;

    for (const item of history) {
      if (item.field !== "comment") continue;

      const comment =
        item.comment?.text_content ||
        (item.comment?.comment || [])
          .map((part: any) => part.text || "")
          .join("")
          .trim();

      const authorUser = item.comment?.user || item.user;
      const author = authorUser?.username || "ClickUp user";
      const isSelf =
        String(authorUser?.id) === String(CLICKUP_USER_ID) ||
        String(author).trim().toLowerCase() === "dev";
      if (isSelf) {
        // Bỏ qua comment do chính bạn tạo ra, không gửi thông báo.
        console.log("Ignored comment by self:", author, authorUser?.id);
        continue;
      }
      await sendZalo(
        `💬 COMMENT MỚI TRONG TASK CỦA BẠN\n\n` +
          `📌 ${task.name}\n` +
          `👤 Người comment: ${author}\n` +
          `📝 Nội dung: ${comment || "(Không có nội dung văn bản)"}\n\n` +
          `🔗 ${taskUrl(task)}`,
      );
    }

    return;
  }

  console.log("Ignored event:", event.event);
}
