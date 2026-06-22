import { BadGatewayException, Injectable } from "@nestjs/common";

@Injectable()
export class TelegramService {
  private async call<T>(token: string, method: string, body?: object): Promise<T> {
    const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/${method}`, { method: body ? "POST" : "GET", headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10_000) });
    const payload = await response.json() as { ok: boolean; result: T; description?: string };
    if (!response.ok || !payload.ok) throw new BadGatewayException(payload.description ?? "Telegram request failed");
    return payload.result;
  }
  getMe(token: string) { return this.call<{ username?: string }>(token, "getMe"); }
  sendMessage(token: string, chatId: string, text: string) { return this.call(token, "sendMessage", { chat_id: chatId, text }); }
}
