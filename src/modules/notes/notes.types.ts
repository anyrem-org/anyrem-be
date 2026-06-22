export type DocNode = {
  type?: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
};
export type NoteInput = {
  title?: string;
  contentJson?: DocNode;
  categoryIds?: string[];
  relatedIds?: string[];
  pinned?: boolean;
};

export const NOTE_SORTS = {
  UPDATED_DESC: "updated_desc",
  CREATED_DESC: "created_desc",
  TITLE_ASC: "title_asc",
} as const;

export type NoteSort = (typeof NOTE_SORTS)[keyof typeof NOTE_SORTS];
export type NoteListQuery = {
  page?: number;
  limit?: number;
  q?: string;
  categoryId?: string;
  pinned?: boolean;
  from?: string;
  to?: string;
  sort?: NoteSort;
};
