import { BadRequestException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { SETTING_DEFAULTS, SETTING_KEYS, SETTING_REGISTRY, SETTING_TYPES, settingEntry, type SettingValue } from "../../common/constants/settings.constants.js";
import { CryptoService, type EncryptedValue } from "../../common/crypto/crypto.service.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import type { SettingUpdate } from "./settings.types.js";

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService, private readonly crypto: CryptoService) {}
  async value<T extends SettingValue>(userId: string, type: string, key: string): Promise<T> { const row = await this.prisma.userSetting.findUnique({ where: { userId_type_key: { userId, type, key } } }); return (row?.value ?? SETTING_DEFAULTS[`${type}.${key}`]) as T; }
  async all(userId: string) {
    const rows = await this.prisma.userSetting.findMany({ where: { userId } });
    const values: Record<string, SettingValue> = Object.fromEntries(SETTING_REGISTRY.filter((x) => !x.secret).map((x) => [`${x.type}.${x.key}`, x.defaultValue]));
    for (const row of rows) if (!settingEntry(row.type, row.key)?.secret) values[`${row.type}.${row.key}`] = row.value as SettingValue;
    const grouped: Record<string, Record<string, SettingValue>> = {};
    for (const [path, value] of Object.entries(values)) { const split = path.indexOf("."); const type = path.slice(0, split); const key = path.slice(split + 1); (grouped[type] ??= {})[key] = value; }
    const chatId = await this.secret(userId, SETTING_KEYS.TELEGRAM.CHAT_ID);
    grouped[SETTING_TYPES.TELEGRAM] = { ...grouped[SETTING_TYPES.TELEGRAM], configured: Boolean(await this.secret(userId, SETTING_KEYS.TELEGRAM.BOT_TOKEN) && chatId), maskedChatId: chatId ? `*****${chatId.slice(-4)}` : null };
    return grouped;
  }
  async update(userId: string, updates: SettingUpdate[]) {
    for (const item of updates) { const entry = settingEntry(item.type, item.key); if (!entry || entry.secret || !entry.validate(item.value)) throw new BadRequestException(`Invalid setting: ${item.type}.${item.key}`); }
    await this.prisma.$transaction(updates.map((item) => this.prisma.userSetting.upsert({ where: { userId_type_key: { userId, type: item.type, key: item.key } }, create: { userId, type: item.type, key: item.key, value: item.value as Prisma.InputJsonValue }, update: { value: item.value as Prisma.InputJsonValue } })));
    return this.all(userId);
  }
  async setSecret(userId: string, key: string, plain: string) { const value = this.crypto.encrypt(plain) as unknown as Prisma.InputJsonValue; return this.prisma.userSetting.upsert({ where: { userId_type_key: { userId, type: SETTING_TYPES.TELEGRAM, key } }, create: { userId, type: SETTING_TYPES.TELEGRAM, key, value }, update: { value } }); }
  async secret(userId: string, key: string) { const row = await this.prisma.userSetting.findUnique({ where: { userId_type_key: { userId, type: SETTING_TYPES.TELEGRAM, key } } }); return row ? this.crypto.decrypt(row.value as unknown as EncryptedValue) : null; }
  setPlain(userId: string, type: string, key: string, value: SettingValue) { return this.prisma.userSetting.upsert({ where: { userId_type_key: { userId, type, key } }, create: { userId, type, key, value: value as Prisma.InputJsonValue }, update: { value: value as Prisma.InputJsonValue } }); }
  deleteTelegram(userId: string) { return this.prisma.userSetting.deleteMany({ where: { userId, type: SETTING_TYPES.TELEGRAM } }); }
}
