import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedValue = { ciphertext: string; iv: string; tag: string; version: 1 };

@Injectable()
export class CryptoService {
  private readonly key: Buffer;
  constructor(config: ConfigService) {
    const raw = config.get<string>("SETTINGS_ENCRYPTION_KEY", "");
    this.key = Buffer.from(raw, "base64");
    if (this.key.length !== 32) throw new InternalServerErrorException("SETTINGS_ENCRYPTION_KEY must be 32 bytes base64");
  }
  hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
  token(bytes = 32) { return randomBytes(bytes).toString("base64url"); }
  encrypt(value: string): EncryptedValue {
    const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    return { ciphertext: Buffer.concat([cipher.update(value, "utf8"), cipher.final()]).toString("base64"), iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), version: 1 };
  }
  decrypt(value: EncryptedValue) {
    const decipher = createDecipheriv("aes-256-gcm", this.key, Buffer.from(value.iv, "base64"));
    decipher.setAuthTag(Buffer.from(value.tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(value.ciphertext, "base64")), decipher.final()]).toString("utf8");
  }
}
