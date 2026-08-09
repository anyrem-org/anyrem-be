import { ServerBlockNoteEditor } from "@blocknote/server-util";
import type { DocNode } from "./notes.types.js";

type Node = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  props?: Record<string, unknown>;
  content?: unknown;
  children?: unknown;
};
const blockNote = ServerBlockNoteEditor.create({
  tables: {
    splitCells: true,
    cellBackgroundColor: true,
    cellTextColor: true,
    headers: true,
  },
});
(blockNote as unknown as { jsdom: { reconfigure: (options: { url: string }) => void } }).jsdom.reconfigure({
  url: "http://localhost",
});
const record = (value: unknown): Node | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Node)
    : undefined;

export const textOf = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(textOf).join("\n");
  const node = record(value);
  if (!node) return "";
  if (typeof node.text === "string") return node.text;
  const content = textOf(node.content);
  const children = textOf(node.children);
  return [content, children]
    .filter(Boolean)
    .join(node.type === "paragraph" || node.type === "heading" ? "\n" : "");
};

export const titleOf = (blocks: DocNode) =>
  Array.isArray(blocks)
    ? textOf(
        record(blocks[0])?.type === "heading" &&
          record(blocks[0])?.props?.level === 1
          ? record(blocks[0])?.content
          : undefined,
      ).trim()
    : "";

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const htmlOf = (value: unknown): string => {
  const node = record(value);
  if (!node) return Array.isArray(value) ? value.map(htmlOf).join("") : "";
  if (node.type === "text") return escapeHtml(node.text ?? "");
  if (node.type === "image" && typeof node.attrs?.src === "string")
    return `<img src="${escapeHtml(node.attrs.src)}" alt="${typeof node.attrs.alt === "string" ? escapeHtml(node.attrs.alt) : ""}">`;
  const children = htmlOf(node.content);
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
  return !tag
    ? children
    : tag === "br"
      ? "<br>"
      : `<${tag}>${children}</${tag}>`;
};
export const blockNoteHtmlOf = (blocks: DocNode) =>
  blockNote.blocksToFullHTML(
    (Array.isArray(blocks) && titleOf(blocks)
      ? blocks.slice(1)
      : blocks) as never,
  );
export const unique = (items: string[] = []) => [...new Set(items)];

export const imagePathsOf = (value?: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(imagePathsOf);
  const node = record(value);
  if (!node) return [];
  const url =
    node.type === "image" ? (node.props?.url ?? node.attrs?.src) : undefined;
  const own = typeof url === "string" ? [uploadPathOf(url)] : [];
  return [
    ...own,
    ...imagePathsOf(node.content),
    ...imagePathsOf(node.children),
  ].filter((path) => path.startsWith("/uploads/note-images/"));
};
const uploadPathOf = (src: string) => {
  try {
    return src.startsWith("http") ? new URL(src).pathname : src;
  } catch {
    return src;
  }
};
