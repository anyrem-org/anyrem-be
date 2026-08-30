import { BadRequestException } from "@nestjs/common";
import { blockNote } from "./notes.helpers.js";
import type { DocNode } from "./notes.types.js";

export type NoteTemplateRecord = {
  title: string;
  content: string;
};

export type NoteTemplateDefinition = {
  id: string;
  name: string;
  schema: string;
  buildContentJson: (record: NoteTemplateRecord) => Promise<DocNode>;
  /** Used for duplicate detection against existing notes and within the same batch. */
  normalizeTitle: (title: string) => string;
};

async function buildVocabularyContentJson(
  record: NoteTemplateRecord,
): Promise<DocNode> {
  const bodyBlocks = await blockNote.tryParseMarkdownToBlocks(
    record.content.trim(),
  );

  return [
    {
      type: "heading",
      props: { level: 1 },
      content: record.title.trim(),
    },
    ...bodyBlocks,
  ] as DocNode;
}

const VOCABULARY_TEMPLATE: NoteTemplateDefinition = {
  id: "vocabulary",
  name: "Vocabulary",
  schema: `
Create one note per English word.

Input fields:
- title: the word only (e.g. "compromise")
- content: markdown body WITHOUT repeating the title. Use exactly these H2 sections in order:

## Meaning
Short Vietnamese meaning.

## Pronunciation
IPA, e.g. /ˈkɒmprəmaɪz/

## Type
noun / verb / adjective / phrase / idiom

## Example
One simple English sentence using the word.

## Easy to remember
Short memory tip, collocations, or synonyms (bullet list allowed).

## Topic
One topic label, e.g. Daily Conversation, Travel, Work.

Rules:
- Use markdown ## for section headings only.
- Do not use H1 (#) in content.
- Keep each section concise.
`.trim(),
  buildContentJson: buildVocabularyContentJson,
  normalizeTitle: (title) => title.trim().toLowerCase(),
};

const NOTE_TEMPLATES: Record<string, NoteTemplateDefinition> = {
  [VOCABULARY_TEMPLATE.id]: VOCABULARY_TEMPLATE,
};

export function listNoteTemplates() {
  return Object.values(NOTE_TEMPLATES).map(({ id, name, schema }) => ({
    id,
    name,
    schema,
  }));
}

export function getNoteTemplate(templateId: string): NoteTemplateDefinition {
  const template = NOTE_TEMPLATES[templateId];
  if (!template) {
    throw new BadRequestException(`Unknown template: ${templateId}`);
  }

  return template;
}

export const DEFAULT_NOTE_TEMPLATE_ID = VOCABULARY_TEMPLATE.id;
