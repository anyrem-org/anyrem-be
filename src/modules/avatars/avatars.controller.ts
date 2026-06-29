import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AvatarsService } from "./avatars.service.js";

@Controller()
@ApiTags("Avatars")
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}
  @Get("avatars")
  list(@Query("style") style?: string) { return this.avatars.list(style); }
  @Get("avatar-styles")
  styles() { return this.avatars.styles(); }
}
