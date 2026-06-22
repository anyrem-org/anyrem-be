import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}
  list() { return this.prisma.avatarCatalog.findMany({ where: { active: true }, select: { id: true, name: true, sha256: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }).then((items) => items.map((x) => ({ id: x.id, name: x.name, imageUrl: `/avatars/${x.id}/image?v=${x.sha256}` }))); }
  async image(id: string) { const avatar = await this.prisma.avatarCatalog.findUnique({ where: { id } }); if (!avatar?.active) throw new NotFoundException(); return avatar; }
  async select(userId: string, avatarId: string) { const avatar = await this.prisma.avatarCatalog.findFirst({ where: { id: avatarId, active: true } }); if (!avatar) throw new BadRequestException("Invalid avatar"); await this.prisma.user.update({ where: { id: userId }, data: { avatarId } }); return { avatarId, imageUrl: `/avatars/${avatarId}/image?v=${avatar.sha256}` }; }
}
