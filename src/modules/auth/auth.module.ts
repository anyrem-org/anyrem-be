import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "../../common/auth/auth.guard.js";
import { TOKEN_TTL } from "../../common/constants/app.constants.js";
import { CryptoService } from "../../common/crypto/crypto.service.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { OAuthCodeService } from "./oauth-code.service.js";

@Global()
@Module({ imports: [ConfigModule, JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ secret: config.getOrThrow("JWT_ACCESS_SECRET"), signOptions: { expiresIn: TOKEN_TTL.ACCESS } }) })], controllers: [AuthController], providers: [AuthService, AuthGuard, CryptoService, OAuthCodeService], exports: [JwtModule, AuthGuard] })
export class AuthModule {}
