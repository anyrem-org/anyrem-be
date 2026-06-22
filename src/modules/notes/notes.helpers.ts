import type { DocNode } from "./notes.types.js";

export const textOf = (node: DocNode): string =>
  node.text ??
  (node.content ?? [])
    .map(textOf)
    .join(node.type === "paragraph" || node.type === "heading" ? "\n" : "");

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const htmlOf = (node: DocNode): string => {
  if (node.type === "text") return escapeHtml(node.text ?? "");
  const children = (node.content ?? []).map(htmlOf).join("");
  const tag = (
    {
      paragraph: "p",
      heading: `h${Number(node.attrs?.level ?? 2)}`,
      bulletList: "ul",
      orderedList: "ol",
      listItem: "li",
      blockquote: "blockquote",
      codeBlock: "pre",
      hardBreak: "br",
      table: "table",
      tableRow: "tr",
      tableCell: "td",
      tableHeader: "th",
    } as Record<string, string>
  )[node.type ?? ""];
  return tag
    ? tag === "br"
      ? "<br>"
      : `<${tag}>${children}</${tag}>`
    : children;
};
export const unique = (items: string[] = []) => [...new Set(items)];
