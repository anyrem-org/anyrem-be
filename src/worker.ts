import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { WorkerRuntime } from "./worker.runtime.js";

const app = await NestFactory.createApplicationContext(AppModule);
app.enableShutdownHooks();
await app.get(WorkerRuntime).start();
