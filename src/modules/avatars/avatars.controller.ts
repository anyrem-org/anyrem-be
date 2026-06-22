import { Controller, Get, Param, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import { AvatarsService } from "./avatars.service.js";

@Controller("avatars")
@ApiTags("Avatars")
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}
  @Get() list() { return this.avatars.list(); }
  @Get(":id/image") async image(@Param("id") id: string, @Res() response: Response) { const avatar = await this.avatars.image(id); response.set({ "content-type": avatar.mimeType, "cache-control": "public, max-age=31536000, immutable", etag: avatar.sha256 }).send(Buffer.from(avatar.imageData)); }
}
