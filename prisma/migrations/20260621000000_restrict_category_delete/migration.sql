ALTER TABLE "note_categories"
DROP CONSTRAINT "note_categories_categoryId_userId_fkey",
ADD CONSTRAINT "note_categories_categoryId_userId_fkey"
FOREIGN KEY ("categoryId", "userId") REFERENCES "categories"("id", "userId")
ON DELETE RESTRICT ON UPDATE CASCADE;
