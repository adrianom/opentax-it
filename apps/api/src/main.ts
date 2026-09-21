import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { validationPipe } from './common/validation.pipe.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(validationPipe);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3001' });
  await app.listen(process.env.API_PORT ?? 3000);
}
await bootstrap();
