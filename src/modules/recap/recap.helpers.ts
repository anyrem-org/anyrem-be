import type { SummaryPayload } from "./recap.types.js";
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export const maskEmail = (email: string) => { const [name, domain] = email.split("@"); return `${name[0]}***@${domain}`; };
export const renderSummary = (payload: SummaryPayload) => `Remember Anything — Daily recap ${payload.date}\n\n${payload.groups.map((g) => `${g.category}\n${g.titles.map((x) => `- ${x}`).join("\n")}`).join("\n\n")}`;
