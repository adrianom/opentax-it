import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { hostAllowlist } from './common/host-allowlist.js';
import { jsonOnly } from './common/json-only.js';
import { validationPipe } from './common/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(hostAllowlist());
  app.use(jsonOnly());
  app.useBodyParser('json', { limit: '50mb' }); // XML imports
  app.setGlobalPrefix('api');
  app.useGlobalPipes(validationPipe);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001' });
  // Localhost only by default: there is no authentication yet (see TODO.md).
  await app.listen(process.env.API_PORT ?? 3000, process.env.API_HOST ?? '127.0.0.1');
}
await bootstrap();
