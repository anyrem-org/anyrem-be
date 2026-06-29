import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  me(id: string) {
    const prisma = this.prisma as any;
    return prisma.user.findFirstOrThrow({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        name: true,
        avatarId: true,
        createdAt: true,
        avatar: {
          select: {
            id: true,
            style: true,
            styleName: true,
            filePath: true,
          },
        },
      },
    });
  }
  update(id: string, name: string) {
    if (typeof name !== "string" || !name.trim())
      throw new BadRequestException("name is required");
    const prisma = this.prisma as any;
    return prisma.user.update({
      where: { id },
      data: { name: name.trim().slice(0, 120) },
      select: {
        id: true,
        email: true,
        name: true,
        avatarId: true,
        avatar: {
          select: {
            id: true,
            style: true,
            styleName: true,
            filePath: true,
          },
        },
      },
    });
  }
}
