import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthProvider, AuthTokenType, UserStatus } from "@prisma/client";
import argon2 from "argon2";
import type { Response } from "express";
import { randomUUID } from "node:crypto";
import { TOKEN_TTL } from "../../common/constants/app.constants.js";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { MailService } from "../../infrastructure/mail/mail.service.js";
import { PrismaService } from "../../infrastructure/prisma/prisma.module.js";
import { normalizeEmail, validEmail } from "./auth.helpers.js";
import { OAuthCodeService } from "./oauth-code.service.js";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly crypto: CryptoService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly codes: OAuthCodeService,
  ) {}
  private async authToken(userId: string, type: AuthTokenType) {
    const token = this.crypto.token();
    await this.prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: this.crypto.hash(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL.AUTH_HOURS * 3_600_000),
      },
    });
    return token;
  }
  private async session(
    user: { id: string; email: string },
    deviceName?: string,
  ) {
    const id = randomUUID();
    const expiresAt = new Date(
      Date.now() + TOKEN_TTL.REFRESH_DAYS * 86_400_000,
    );
    const refreshToken = await this.jwt.signAsync(
      { id: user.id, email: user.email, sessionId: id },
      {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
        expiresIn: `${TOKEN_TTL.REFRESH_DAYS}d`,
      },
    );
    await this.prisma.refreshSession.create({
      data: {
        id,
        userId: user.id,
        refreshTokenHash: this.crypto.hash(refreshToken),
        deviceName,
        expiresAt,
      },
    });
    return {
      accessToken: await this.jwt.signAsync({ id: user.id, email: user.email }),
      refreshToken,
      expiresIn: 900,
    };
  }
  async register(emailInput: string, password: string, name: string) {
    const email = normalizeEmail(emailInput);
    if (!validEmail(email) || password.length < 10 || !name?.trim())
      throw new BadRequestException(
        "Valid email, name, and password of at least 10 characters are required",
      );
    if (await this.prisma.user.findUnique({ where: { email } }))
      throw new ConflictException("Email already exists");
    const user = await this.prisma.user.create({
      data: {
        email,
        name: name.trim(),
        accounts: {
          create: {
            provider: AuthProvider.EMAIL,
            providerAccountId: email,
            passwordHash: await argon2.hash(password),
          },
        },
      },
    });
    const token = await this.authToken(user.id, AuthTokenType.VERIFY_EMAIL);
    await this.mail.send(
      email,
      "Verify your Remember Anything email",
      `${this.config.getOrThrow("APP_URL")}/auth/verify-email?token=${encodeURIComponent(token)}`,
    );
    return { id: user.id, email: user.email, verificationRequired: true };
  }
  async verifyEmail(token: string) {
    if (!token) throw new BadRequestException("token is required");
    const row = await this.prisma.authToken.findFirst({
      where: {
        tokenHash: this.crypto.hash(token),
        type: AuthTokenType.VERIFY_EMAIL,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) throw new BadRequestException("Invalid or expired token");
    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: row.userId },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);
    return { verified: true };
  }
  async resendVerification(emailInput: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(emailInput) },
    });
    if (user && !user.emailVerifiedAt) {
      await this.prisma.authToken.deleteMany({
        where: {
          userId: user.id,
          type: AuthTokenType.VERIFY_EMAIL,
          usedAt: null,
        },
      });
      const token = await this.authToken(user.id, AuthTokenType.VERIFY_EMAIL);
      await this.mail.send(
        user.email,
        "Verify your Remember Anything email",
        `${this.config.getOrThrow("APP_URL")}/auth/verify-email?token=${encodeURIComponent(token)}`,
      );
    }
    return { accepted: true };
  }
  async login(emailInput: string, password: string, deviceName?: string) {
    if (typeof password !== "string") {
      throw new UnauthorizedException("Invalid credentials");
    }

    const email = normalizeEmail(emailInput);
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });
    const account = user?.accounts.find(
      (x) => x.provider === AuthProvider.EMAIL,
    );

    if (
      !user ||
      user.status !== UserStatus.ACTIVE ||
      !account?.passwordHash ||
      !(await argon2.verify(account.passwordHash, password))
    ) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException("Email is not verified");
    }

    return this.session(user, deviceName);
  }
  async refresh(refreshToken: string) {
    if (!refreshToken) throw new UnauthorizedException();
    let payload: { id: string; email: string; sessionId: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException();
    }
    const session = await this.prisma.refreshSession.findFirst({
      where: {
        id: payload.sessionId,
        userId: payload.id,
        refreshTokenHash: this.crypto.hash(refreshToken),
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!session) throw new UnauthorizedException();
    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { lastUsedAt: new Date() },
    });
    return {
      accessToken: await this.jwt.signAsync({
        id: payload.id,
        email: payload.email,
      }),
      expiresIn: 900,
    };
  }
  async logout(refreshToken: string) {
    if (!refreshToken)
      throw new BadRequestException("refreshToken is required");
    await this.prisma.refreshSession.updateMany({
      where: {
        refreshTokenHash: this.crypto.hash(refreshToken),
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }
  async forgot(emailInput: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: normalizeEmail(emailInput) },
    });
    if (user?.emailVerifiedAt) {
      const token = await this.authToken(user.id, AuthTokenType.RESET_PASSWORD);
      await this.mail.send(
        user.email,
        "Reset your Remember Anything password",
        `${this.config.getOrThrow("APP_URL")}/auth/reset-password?token=${encodeURIComponent(token)}`,
      );
    }
    return { accepted: true };
  }
  async reset(token: string, password: string) {
    if (!token || typeof password !== "string" || password.length < 10)
      throw new BadRequestException(
        "Token and password of at least 10 characters are required",
      );
    const row = await this.prisma.authToken.findFirst({
      where: {
        tokenHash: this.crypto.hash(token),
        type: AuthTokenType.RESET_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (!row) throw new BadRequestException("Invalid or expired token");
    await this.prisma.$transaction([
      this.prisma.authToken.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.authAccount.update({
        where: {
          userId_provider: { userId: row.userId, provider: AuthProvider.EMAIL },
        },
        data: { passwordHash: await argon2.hash(password) },
      }),
      this.prisma.refreshSession.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { reset: true };
  }
  async googleStart(response: Response) {
    const state = await this.codes.create("google-state", "valid", 600);
    const params = new URLSearchParams({
      client_id: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
      redirect_uri: `${this.config.getOrThrow("APP_URL")}/auth/google/callback`,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
    });
    response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }
  async googleCallback(code: string, state: string, response: Response) {
    if (!code || !state)
      throw new BadRequestException("OAuth code and state are required");
    if (!(await this.codes.consume("google-state", state)))
      throw new UnauthorizedException("Invalid OAuth state");
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
        client_secret: this.config.getOrThrow("GOOGLE_CLIENT_SECRET"),
        redirect_uri: `${this.config.getOrThrow("APP_URL")}/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResponse.ok)
      throw new UnauthorizedException("Google token exchange failed");
    const token = (await tokenResponse.json()) as { access_token: string };
    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { authorization: `Bearer ${token.access_token}` } },
    );
    const profile = (await profileResponse.json()) as {
      sub: string;
      email: string;
      email_verified: boolean;
      name?: string;
    };
    if (!profile.email_verified)
      throw new UnauthorizedException("Google email is not verified");
    const email = normalizeEmail(profile.email);
    const user = await this.prisma.$transaction(async (tx) => {
      const linked = await tx.authAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: AuthProvider.GOOGLE,
            providerAccountId: profile.sub,
          },
        },
        include: { user: true },
      });
      if (linked) return linked.user;
      const existing = await tx.user.findUnique({ where: { email } });
      const user =
        existing ??
        (await tx.user.create({
          data: {
            email,
            name: profile.name ?? email.split("@")[0],
            emailVerifiedAt: new Date(),
          },
        }));
      if (!user.emailVerifiedAt)
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      await tx.authAccount.create({
        data: {
          userId: user.id,
          provider: AuthProvider.GOOGLE,
          providerAccountId: profile.sub,
        },
      });
      return user;
    });
    const appCode = await this.codes.create(
      "google-login",
      JSON.stringify({ id: user.id, email: user.email }),
      60,
    );
    response.redirect(
      `${this.config.getOrThrow("DESKTOP_CALLBACK_URL")}?code=${encodeURIComponent(appCode)}`,
    );
  }
  async googleExchange(code: string, deviceName?: string) {
    const raw = await this.codes.consume("google-login", code);
    if (!raw) throw new UnauthorizedException("Invalid or expired code");
    return this.session(
      JSON.parse(raw) as { id: string; email: string },
      deviceName,
    );
  }
}
