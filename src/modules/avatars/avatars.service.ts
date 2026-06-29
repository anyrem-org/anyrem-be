import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";

@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}
  list(style?: string) {
    const prisma = this.prisma as any;
    return prisma.avatarCatalog.findMany({
      where: { isActive: true, style: style || undefined },
      select: {
        id: true,
        name: true,
        style: true,
        styleName: true,
        filePath: true,
        seed: true,
        sortOrder: true,
      },
      orderBy: [{ styleName: "asc" }, { sortOrder: "asc" }, { id: "asc" }],
    });
  }
  styles() {
    const prisma = this.prisma as any;
    return prisma.avatarCatalog.groupBy({
      by: ["style", "styleName"],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: [{ styleName: "asc" }, { style: "asc" }],
    }).then((items: Array<{ style: string; styleName: string; _count: { _all: number } }>) =>
      items.map((item) => ({
        style: item.style,
        styleName: item.styleName,
        count: item._count._all,
      })),
    );
  }
  async select(userId: string, avatarId: string) {
    const prisma = this.prisma as any;
    const avatar = await prisma.avatarCatalog.findFirst({
      where: { id: avatarId, isActive: true },
      select: { id: true, style: true, styleName: true, filePath: true },
    });
    if (!avatar) throw new BadRequestException("Invalid avatar");
    await prisma.user.update({ where: { id: userId }, data: { avatarId } });
    return avatar;
  }
}
