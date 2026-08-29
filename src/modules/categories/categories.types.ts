export type CategoryInput = {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
};

export const CATEGORY_SORTS = {
  UPDATED_DESC: "updated_desc",
  UPDATED_ASC: "updated_asc",
  NOTE_COUNT_DESC: "note_count_desc",
  NOTE_COUNT_ASC: "note_count_asc",
} as const;

export type CategorySort = (typeof CATEGORY_SORTS)[keyof typeof CATEGORY_SORTS];
export type CategoryListQuery = {
  page?: number;
  limit?: number;
  q?: string;
  sort?: CategorySort;
};
