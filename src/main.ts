import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.useGlobalPipes(new ValidationPipe());

  app.useStaticAssets(join(process.cwd()), {
    prefix: '/',
    index: 'index.html',
  });

  await app.listen(process.env.PORT ?? 3000);
}

await bootstrap();
