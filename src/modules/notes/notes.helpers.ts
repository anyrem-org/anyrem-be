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
  if (node.type === "image" && typeof node.attrs?.src === "string") {
    const src = escapeHtml(node.attrs.src);
    const alt = typeof node.attrs.alt === "string" ? escapeHtml(node.attrs.alt) : "";
    return `<img src="${src}" alt="${alt}">`;
  }
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

export const imagePathsOf = (node?: DocNode): string[] => {
  if (!node) return [];
  const src = typeof node.attrs?.src === "string" ? uploadPathOf(node.attrs.src) : undefined;
  const own =
    node.type === "image" && src
      ? [src]
      : [];
  return [...own, ...(node.content ?? []).flatMap(imagePathsOf)].filter((path) =>
    path.startsWith("/uploads/note-images/"),
  );
};

const uploadPathOf = (src: string) => {
  try {
    return src.startsWith("http") ? new URL(src).pathname : src;
  } catch {
    return src;
  }
};
