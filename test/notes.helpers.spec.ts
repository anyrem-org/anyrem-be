import { describe, expect, it } from "vitest";
import { blockNoteHtmlOf } from "../src/modules/notes/notes.helpers.js";

describe("BlockNote HTML", () => {
  it("serializes an uploaded image", async () => {
    await expect(
      blockNoteHtmlOf([
        {
          type: "image",
          props: {
            url: "http://localhost/uploads/note-images/test.png",
            name: "test.png",
            caption: "",
            showPreview: true,
            previewWidth: 512,
          },
        },
      ]),
    ).resolves.toContain("/uploads/note-images/test.png");
  });
});
