import type { SummaryPayload } from "./recap.types.js";

export const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );

export const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  return `${name[0]}***@${domain}`;
};

export const noteSnippet = (value: string) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

export const renderSummary = (payload: SummaryPayload) =>
  `Remember Anything - Daily recap ${payload.date}\n\n${payload.noteCount} notes today\n\n${payload.groups.map((g) => `${g.category}\n${g.notes.map((x) => `- ${x.title}${x.snippet ? `\n  ${x.snippet}` : ""}`).join("\n")}`).join("\n\n")}`;

export const renderSummaryHtml = (payload: SummaryPayload) =>
  `<h1>Daily recap ${escapeHtml(payload.date)}</h1><p>${payload.noteCount} notes today</p>${payload.groups.map((g) => `<h2>${escapeHtml(g.category)}</h2><ul>${g.notes.map((x) => `<li><strong>${escapeHtml(x.title)}</strong>${x.snippet ? `<br>${escapeHtml(x.snippet)}` : ""}</li>`).join("")}</ul>`).join("")}`;
