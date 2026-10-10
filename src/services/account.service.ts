import { searchAccounts } from "./sheet.service.ts";
import { canViewAccounts } from "./user-map.service.ts";
import { sendZaloTo } from "./zalo.service.ts";

const MAX_RESULTS = 10;

export const ACCOUNT_COMMAND_RE = /^\/acc(?:@\S+)?(?:\s+([\s\S]*))?$/i;

/** Handles "/acc <keyword>": lists Accounts rows whose project/domain contains the keyword. */
export const handleAccountSearch = async (chatId: string, userId: string, content: string): Promise<void> => {
    if (!canViewAccounts(userId)) {
        await sendZaloTo(chatId, "Bạn không có quyền xem thông tin tài khoản.");
        return;
    }

    const query = (content.match(ACCOUNT_COMMAND_RE)?.[1] ?? "").trim();
    if (!query) {
        await sendZaloTo(chatId, "Cú pháp: /acc <từ khóa>. Ví dụ: /acc n8n");
        return;
    }

    const rows = await searchAccounts(query);
    if (rows.length === 0) {
        await sendZaloTo(chatId, `Không tìm thấy tài khoản nào khớp "${query}".`);
        return;
    }

    const shown = rows.slice(0, MAX_RESULTS);
    const body = shown
        .map((r, i) => `${i + 1}) ${r.project}\nUser: ${r.username}\nPass: ${r.password}\nURL: ${r.url}`)
        .join("\n\n");
    const more = rows.length > shown.length ? `\n\n(Còn ${rows.length - shown.length} kết quả nữa, hãy thu hẹp từ khóa.)` : "";
    await sendZaloTo(chatId, `Tìm thấy ${rows.length} tài khoản khớp "${query}":\n\n${body}${more}`);
};
