import { Body, Controller, Get, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import { ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service.js";
import {
  EmailDto,
  GoogleExchangeDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
} from "./auth.dto.js";

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("register") register(@Body() body: RegisterDto) {
    return this.auth.register(body.email, body.password, body.name);
  }
  @Post("verify-email") verify(@Body() body: TokenDto) {
    return this.auth.verifyEmail(body.token);
  }
  @Post("resend-verification") resend(@Body() body: EmailDto) {
    return this.auth.resendVerification(body.email);
  }
  @Post("login") login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password, body.deviceName);
  }
  @Post("refresh") refresh(@Body() body: RefreshTokenDto) {
    return this.auth.refresh(body.refreshToken);
  }
  @Post("logout") logout(@Body() body: RefreshTokenDto) {
    return this.auth.logout(body.refreshToken);
  }
  @Post("forgot-password") forgot(@Body() body: EmailDto) {
    return this.auth.forgot(body.email);
  }
  @Post("reset-password") reset(@Body() body: ResetPasswordDto) {
    return this.auth.reset(body.token, body.password);
  }
  @Get("google") google(@Res() response: Response) {
    return this.auth.googleStart(response);
  }
  @Get("google/callback") googleCallback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Res() response: Response,
  ) {
    return this.auth.googleCallback(code, state, response);
  }
  @Post("google/exchange") googleExchange(@Body() body: GoogleExchangeDto) {
    return this.auth.googleExchange(body.code, body.deviceName);
  }
}
