import { ConfigService } from "@nestjs/config";

export type TelegramConfig = {
  productDeployTelegramId: string;
  botToken: string;
};

export function getTelegramConfig(config: ConfigService): TelegramConfig {
  const productDeployTelegramId = config.getOrThrow(
    "PRODUCT_DEPLOY_TELEGRAM_ID",
  );
  const botToken = config.getOrThrow("TELEGRAM_BOT_TOKEN");

  return {
    productDeployTelegramId,
    botToken,
  };
}
