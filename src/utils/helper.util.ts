import { USER_TABS, ENV_CONFIG } from "../constants/index.contants.ts";

export const canViewAccounts = (userId: string): boolean => ENV_CONFIG.ACCOUNT_VIEWERS.includes(userId);

export const getTab = (userId: string): number | undefined => USER_TABS[userId];

/** Compare names ignoring case, accents and extra spaces ("Kiệt" == "kiet"). */
export const normalizeName = (s: string): string =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").replace(/\s+/g, " ").trim().toLowerCase();