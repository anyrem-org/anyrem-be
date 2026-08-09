-- Existing notes remain Tiptap. New BlockNote notes opt in through editor_format.
CREATE TYPE "NoteEditorFormat" AS ENUM ('TIPTAP', 'BLOCKNOTE');
ALTER TABLE "notes" ADD COLUMN "editorFormat" "NoteEditorFormat" NOT NULL DEFAULT 'TIPTAP';
