import { ValidationPipe } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { LoginDto } from "../src/modules/auth/auth.dto.js";

describe("DTO whitelist", () => {
  it("keeps validated login fields", async () => {
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const result = await pipe.transform(
      { email: "nguyenanhvu.work@gmail.com", password: "123456", deviceName: "Swagger", ignored: true },
      { type: "body", metatype: LoginDto },
    );
    expect(result).toEqual({ email: "nguyenanhvu.work@gmail.com", password: "123456", deviceName: "Swagger" });
  });
});
