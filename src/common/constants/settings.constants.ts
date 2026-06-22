export const SETTING_TYPES = {
  APPEARANCE: "appearance",
  REGIONAL: "regional",
  SEARCH: "search",
  RECAP: "recap",
  TELEGRAM: "telegram",
} as const;

export const SETTING_KEYS = {
  APPEARANCE: { THEME: "theme", COMPACT_DENSITY: "compact_density", SHOW_ACTIVITY_PANEL: "show_activity_panel" },
  REGIONAL: { LOCALE: "locale", TIMEZONE: "timezone" },
  SEARCH: { SEARCH_AS_YOU_TYPE: "search_as_you_type", SAVE_HISTORY: "save_history", TYPO_TOLERANCE: "typo_tolerance" },
  RECAP: { ENABLED: "enabled", DELIVERY_TIME: "delivery_time", EMAIL_ENABLED: "email_enabled", TELEGRAM_ENABLED: "telegram_enabled" },
  TELEGRAM: { BOT_TOKEN: "bot_token", CHAT_ID: "chat_id", BOT_USERNAME: "bot_username", VERIFIED_AT: "verified_at" },
} as const;

export const THEMES = { LIGHT: "LIGHT", DARK: "DARK", SYSTEM: "SYSTEM" } as const;
export const TYPO_TOLERANCES = { STRICT: "STRICT", BALANCED: "BALANCED", FLEXIBLE: "FLEXIBLE" } as const;
export type SettingType = (typeof SETTING_TYPES)[keyof typeof SETTING_TYPES];
export type SettingValue = string | boolean | number | null | Record<string, string>;

type Entry = { type: SettingType; key: string; defaultValue: SettingValue; validate: (value: unknown) => boolean; secret: boolean };
const bool = (value: unknown) => typeof value === "boolean";
const oneOf = (values: readonly string[]) => (value: unknown) => typeof value === "string" && values.includes(value);
const string = (value: unknown) => typeof value === "string" && value.length > 0;
export const isValidTime = (value: unknown) => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const isTimezone = (value: unknown) => {
  if (typeof value !== "string") return false;
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return true; } catch { return false; }
};

export const SETTING_REGISTRY = [
  { type: SETTING_TYPES.APPEARANCE, key: SETTING_KEYS.APPEARANCE.THEME, defaultValue: THEMES.LIGHT, validate: oneOf(Object.values(THEMES)), secret: false },
  { type: SETTING_TYPES.APPEARANCE, key: SETTING_KEYS.APPEARANCE.COMPACT_DENSITY, defaultValue: false, validate: bool, secret: false },
  { type: SETTING_TYPES.APPEARANCE, key: SETTING_KEYS.APPEARANCE.SHOW_ACTIVITY_PANEL, defaultValue: true, validate: bool, secret: false },
  { type: SETTING_TYPES.REGIONAL, key: SETTING_KEYS.REGIONAL.LOCALE, defaultValue: "vi-VN", validate: string, secret: false },
  { type: SETTING_TYPES.REGIONAL, key: SETTING_KEYS.REGIONAL.TIMEZONE, defaultValue: "Asia/Ho_Chi_Minh", validate: isTimezone, secret: false },
  { type: SETTING_TYPES.SEARCH, key: SETTING_KEYS.SEARCH.SEARCH_AS_YOU_TYPE, defaultValue: true, validate: bool, secret: false },
  { type: SETTING_TYPES.SEARCH, key: SETTING_KEYS.SEARCH.SAVE_HISTORY, defaultValue: true, validate: bool, secret: false },
  { type: SETTING_TYPES.SEARCH, key: SETTING_KEYS.SEARCH.TYPO_TOLERANCE, defaultValue: TYPO_TOLERANCES.BALANCED, validate: oneOf(Object.values(TYPO_TOLERANCES)), secret: false },
  { type: SETTING_TYPES.RECAP, key: SETTING_KEYS.RECAP.ENABLED, defaultValue: true, validate: bool, secret: false },
  { type: SETTING_TYPES.RECAP, key: SETTING_KEYS.RECAP.DELIVERY_TIME, defaultValue: "22:00", validate: isValidTime, secret: false },
  { type: SETTING_TYPES.RECAP, key: SETTING_KEYS.RECAP.EMAIL_ENABLED, defaultValue: true, validate: bool, secret: false },
  { type: SETTING_TYPES.RECAP, key: SETTING_KEYS.RECAP.TELEGRAM_ENABLED, defaultValue: false, validate: bool, secret: false },
  { type: SETTING_TYPES.TELEGRAM, key: SETTING_KEYS.TELEGRAM.BOT_TOKEN, defaultValue: null, validate: string, secret: true },
  { type: SETTING_TYPES.TELEGRAM, key: SETTING_KEYS.TELEGRAM.CHAT_ID, defaultValue: null, validate: string, secret: true },
  { type: SETTING_TYPES.TELEGRAM, key: SETTING_KEYS.TELEGRAM.BOT_USERNAME, defaultValue: null, validate: string, secret: false },
  { type: SETTING_TYPES.TELEGRAM, key: SETTING_KEYS.TELEGRAM.VERIFIED_AT, defaultValue: null, validate: string, secret: false },
] satisfies Entry[];

export const SETTING_DEFAULTS = Object.fromEntries(SETTING_REGISTRY.map((x) => [`${x.type}.${x.key}`, x.defaultValue]));
export const settingEntry = (type: string, key: string) => SETTING_REGISTRY.find((x) => x.type === type && x.key === key);
