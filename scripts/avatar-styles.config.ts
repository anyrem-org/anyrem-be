export const AVATAR_VERSION = "10.x";

export const AVATAR_STYLES = [
  {
    key: "lorelei",
    folder: "lorelei",
    displayName: "Lorelei",
    count: 20,
    enabled: true,
  },
  {
    key: "bottts",
    folder: "bottts",
    displayName: "Bottts",
    count: 20,
    enabled: true,
  },
  {
    key: "pixelArt",
    folder: "pixel-art",
    displayName: "Pixel Art",
    count: 20,
    enabled: true,
  },
  {
    key: "openPeeps",
    folder: "open-peeps",
    displayName: "Open Peeps",
    count: 20,
    enabled: true,
  },
  {
    key: "personas",
    folder: "personas",
    displayName: "Personas",
    count: 20,
    enabled: true,
  },
  {
    key: "micah",
    folder: "micah",
    displayName: "Micah",
    count: 20,
    enabled: true,
  },
] as const;

export type AvatarStyleConfig = (typeof AVATAR_STYLES)[number];
