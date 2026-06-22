import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "ioredis";
import { randomUUID } from "node:crypto";

@Injectable()
export class OAuthCodeService {
  private readonly redis: Redis;
  constructor(config: ConfigService) { this.redis = new Redis(config.getOrThrow("REDIS_URL"), { maxRetriesPerRequest: 2 }); }
  async create(prefix: string, value: string, seconds = 300) { const code = randomUUID(); await this.redis.set(`${prefix}:${code}`, value, "EX", seconds); return code; }
  async consume(prefix: string, code: string) { const key = `${prefix}:${code}`; const value = await this.redis.get(key); if (value) await this.redis.del(key); return value; }
}
