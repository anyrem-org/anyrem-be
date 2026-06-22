import { BadRequestException, Body, Controller, Delete, Get, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { AuthGuard, CurrentUser, type AuthUser } from "../../common/auth/auth.guard.js";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SETTING_KEYS, SETTING_TYPES } from "../../common/constants/settings.constants.js";
import { TelegramService } from "../../infrastructure/telegram/telegram.service.js";
import { SettingsService } from "./settings.service.js";
import type { SettingUpdate } from "./settings.types.js";
import { TelegramConfigDto, UpdateSettingsDto } from "./settings.dto.js";

@Controller("settings")
@UseGuards(AuthGuard)
@ApiTags("Settings")
@ApiBearerAuth()
export class SettingsController {
  constructor(private readonly settings: SettingsService, private readonly telegram: TelegramService) {}
  @Get() get(@CurrentUser() user: AuthUser) { return this.settings.all(user.id); }
  @Patch() patch(@CurrentUser() user: AuthUser, @Body() body: UpdateSettingsDto) { if (!Array.isArray(body.settings)) throw new BadRequestException("settings must be an array"); return this.settings.update(user.id, body.settings as SettingUpdate[]); }
  @Put("telegram") async configureTelegram(@CurrentUser() user: AuthUser, @Body() body: TelegramConfigDto) { if (!body.botToken || !body.chatId) throw new BadRequestException("botToken and chatId are required"); const bot = await this.telegram.getMe(body.botToken); await Promise.all([this.settings.setSecret(user.id, SETTING_KEYS.TELEGRAM.BOT_TOKEN, body.botToken), this.settings.setSecret(user.id, SETTING_KEYS.TELEGRAM.CHAT_ID, body.chatId), this.settings.setPlain(user.id, SETTING_TYPES.TELEGRAM, SETTING_KEYS.TELEGRAM.BOT_USERNAME, bot.username ?? "unknown"), this.settings.setPlain(user.id, SETTING_TYPES.TELEGRAM, SETTING_KEYS.TELEGRAM.VERIFIED_AT, new Date().toISOString())]); return this.settings.all(user.id); }
  @Post("telegram/test") async testTelegram(@CurrentUser() user: AuthUser) { const token = await this.settings.secret(user.id, SETTING_KEYS.TELEGRAM.BOT_TOKEN); const chatId = await this.settings.secret(user.id, SETTING_KEYS.TELEGRAM.CHAT_ID); if (!token || !chatId) throw new BadRequestException("Telegram is not configured"); await this.telegram.sendMessage(token, chatId, "Remember Anything: Telegram connection works."); return { sent: true }; }
  @Delete("telegram") async removeTelegram(@CurrentUser() user: AuthUser) { await this.settings.deleteTelegram(user.id); return { configured: false }; }
}
