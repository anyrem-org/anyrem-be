// @ts-nocheck
import { Avatar, Style } from "@dicebear/core";
import bottts from "@dicebear/styles/bottts.json" with { type: "json" };
import lorelei from "@dicebear/styles/lorelei.json" with { type: "json" };
import micah from "@dicebear/styles/micah.json" with { type: "json" };
import openPeeps from "@dicebear/styles/open-peeps.json" with { type: "json" };
import personas from "@dicebear/styles/personas.json" with { type: "json" };
import pixelArt from "@dicebear/styles/pixel-art.json" with { type: "json" };
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  AVATAR_STYLES,
  AVATAR_VERSION,
  type AvatarStyleConfig,
} from "./avatar-styles.config.js";

type ManifestItem = {
  name: string;
  file: string;
  provider: "dicebear";
  version: string;
  style: string;
  styleName: string;
  seed: string;
  sortOrder: number;
  isActive: boolean;
};

const STYLE_DEFINITIONS = {
  lorelei: new Style(lorelei),
  bottts: new Style(bottts),
  pixelArt: new Style(pixelArt),
  openPeeps: new Style(openPeeps),
  personas: new Style(personas),
  micah: new Style(micah),
} as const;

const root = resolve("assets/avatars");

function assertStyleDefinition(style: AvatarStyleConfig) {
  const definition = STYLE_DEFINITIONS[style.key as keyof typeof STYLE_DEFINITIONS];
  if (!definition) {
    throw new Error(`Missing DiceBear definition for style "${style.key}"`);
  }
  return definition;
}

const manifest: ManifestItem[] = [];
let sortOrder = 1;

for (const style of AVATAR_STYLES) {
  if (!style.enabled) continue;
  const definition = assertStyleDefinition(style);
  const folder = resolve(root, style.folder);
  console.log(`Generating ${style.count} avatars for ${style.displayName}...`);
  await rm(folder, { recursive: true, force: true });
  await mkdir(folder, { recursive: true });

  for (let index = 1; index <= style.count; index += 1) {
    const suffix = String(index).padStart(3, "0");
    const seed = `${style.folder}-${suffix}`;
    const fileName = `avatar-${style.folder}-${suffix}.svg`;
    const relativeFile = `${style.folder}/${fileName}`;
    const svg = new Avatar(definition, { seed }).toString();
    await writeFile(resolve(folder, fileName), svg, "utf8");
    manifest.push({
      name: `${style.displayName} ${suffix}`,
      file: relativeFile,
      provider: "dicebear",
      version: AVATAR_VERSION,
      style: style.folder,
      styleName: style.displayName,
      seed,
      sortOrder,
      isActive: true,
    });
    sortOrder += 1;
  }
}

await writeFile(resolve(root, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${manifest.length} avatars across ${AVATAR_STYLES.filter((x) => x.enabled).length} styles.`);
