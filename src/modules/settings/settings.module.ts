import { Module } from "@nestjs/common";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { SettingsController } from "./settings.controller.js";
import { SettingsService } from "./settings.service.js";

@Module({ controllers: [SettingsController], providers: [SettingsService, CryptoService], exports: [SettingsService, CryptoService] })
export class SettingsModule {}
