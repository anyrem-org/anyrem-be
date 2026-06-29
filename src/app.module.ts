import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./modules/auth/auth.module.js";
import { ActivityModule } from "./modules/activity/activity.module.js";
import { AvatarsModule } from "./modules/avatars/avatars.module.js";
import { CategoriesModule } from "./modules/categories/categories.module.js";
import { DashboardModule } from "./modules/dashboard/dashboard.module.js";
import { NotesModule } from "./modules/notes/notes.module.js";
import { RecapModule } from "./modules/recap/recap.module.js";
import { SearchModule } from "./modules/search/search.module.js";
import { SettingsModule } from "./modules/settings/settings.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { InfrastructureModule } from "./infrastructure/infrastructure.module.js";
import { PrismaModule } from "./infrastructure/prisma/prisma.module.js";
import { WorkerRuntime } from "./worker.runtime.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    InfrastructureModule,
    ActivityModule,
    AuthModule,
    UsersModule,
    AvatarsModule,
    SettingsModule,
    NotesModule,
    CategoriesModule,
    SearchModule,
    DashboardModule,
    RecapModule,
  ],
  controllers: [HealthController],
  providers: [WorkerRuntime],
})
export class AppModule {}
