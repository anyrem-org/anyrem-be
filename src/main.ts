import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { static as serveStatic } from "express";
import { resolve } from "node:path";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);
app
  .getHttpAdapter()
  .getInstance()
  .set("json replacer", (_key: string, value: unknown) =>
    typeof value === "bigint" ? value.toString() : value,
  );
app.setGlobalPrefix("api");
app.enableCors({ origin: true, credentials: true });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
app.use("/avatars", serveStatic(resolve(process.cwd(), "assets/avatars")));
const swaggerConfig = new DocumentBuilder()
  .setTitle("AnyRem API")
  .setDescription("Remember Anything backend API")
  .setVersion("0.1.0")
  .addBearerAuth()
  .build();
SwaggerModule.setup(
  "api/docs",
  app,
  SwaggerModule.createDocument(app, swaggerConfig),
  { swaggerOptions: { persistAuthorization: true } },
);
await app.listen(Number(process.env.PORT ?? 3000));
