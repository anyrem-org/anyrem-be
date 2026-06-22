import { Module } from "@nestjs/common";
import { AvatarsController } from "./avatars.controller.js";
import { AvatarsService } from "./avatars.service.js";
import { UserAvatarController } from "./user-avatar.controller.js";

@Module({ controllers: [AvatarsController, UserAvatarController], providers: [AvatarsService] })
export class AvatarsModule {}
