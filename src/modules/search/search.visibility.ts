import type { Prisma } from "@prisma/client";

type NoteCategoryLink = {
  category: { showInGlobalSearch: boolean };
};

type NoteVisibilitySource = {
  showInGlobalSearch: boolean;
  categories: NoteCategoryLink[];
};

export function isShownInGlobalSearch(note: NoteVisibilitySource): boolean {
  if (!note.showInGlobalSearch) {
    return false;
  }

  return note.categories.every((link) => link.category.showInGlobalSearch);
}

export function globalSearchVisibilityWhere(): Prisma.NoteWhereInput {
  return {
    showInGlobalSearch: true,
    categories: { every: { category: { showInGlobalSearch: true } } },
  };
}
