import { describe, expect, it } from "vitest";
import { SETTING_KEYS, SETTING_REGISTRY, SETTING_TYPES, isValidTime, settingEntry } from "../src/common/constants/settings.constants.js";
import { localDateInfo } from "../src/common/date/timezone.js";

describe("settings registry", () => {
  it("owns every type/key pair", () => { expect(new Set(SETTING_REGISTRY.map((x) => `${x.type}.${x.key}`)).size).toBe(SETTING_REGISTRY.length); expect(settingEntry(SETTING_TYPES.RECAP, SETTING_KEYS.RECAP.DELIVERY_TIME)?.validate("22:00")).toBe(true); });
  it("rejects invalid time", () => { expect(isValidTime("24:00")).toBe(false); expect(isValidTime("9:00")).toBe(false); });
  it("calculates Saigon local day", () => { const day = localDateInfo(new Date("2026-06-20T16:30:00Z"), "Asia/Ho_Chi_Minh"); expect(day.key).toBe("2026-06-20"); expect(day.localTime).toBe("23:30"); });
});
