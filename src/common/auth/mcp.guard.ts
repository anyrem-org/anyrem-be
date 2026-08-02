import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import * as jose from "jose";
import { PrismaService } from "../../infrastructure/prisma/prisma.service.js";

export type McpAuthUser = { id: string; email: string };

type AuthRequest = Request & { user?: McpAuthUser };

type MCPJWTVerifyResult = jose.JWTPayload & {
  email?: string;
};

@Injectable()
export class McpGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = request.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const audience = this.configService.getOrThrow("AUTH_SERVER_AUD");
    const issuer = this.configService.getOrThrow("AUTH_SERVER_ISSUER");

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      console.log(39, token);
      const { payload } = await jose.jwtVerify<MCPJWTVerifyResult>(
        token,
        this.getRemoteJWKSet(),
        {
          algorithms: ["RS256"],
          audience,
          issuer,
        },
      );

      request.user = await this.getUser(payload);
      return true;
    } catch (error) {
      console.log(53, error);
      throw new UnauthorizedException();
    }
  }

  private async getUser(payload: MCPJWTVerifyResult): Promise<McpAuthUser> {
    if (!payload.email) {
      throw new BadRequestException("Missing email field in jwt payload");
    }

    const user = await this.prisma.user.findUnique({
      where: {
        email: payload.email,
      },
      select: {
        email: true,
        id: true,
      },
    });

    if (!user) {
      throw new BadRequestException("Invalid jwt payload");
    }

    return {
      email: user.email,
      id: user.id,
    };
  }

  private getRemoteJWKSet() {
    const url = this.configService.getOrThrow("JWKS_URL");
    const JWKS = jose.createRemoteJWKSet(new URL(url));

    return JWKS;
  }
}

export const McpCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) =>
    ctx.switchToHttp().getRequest<AuthRequest>().user as McpAuthUser,
);
