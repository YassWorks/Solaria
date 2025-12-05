import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import swagger from './swagger';
import { ValidationPipe } from '@nestjs/common';
import path from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  

  if (process.env.NODE_ENV !== 'production') swagger(app);
  app.useStaticAssets(path.join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  //Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close();
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
