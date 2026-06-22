import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("api");
app.enableCors({ origin: true, credentials: true });
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
