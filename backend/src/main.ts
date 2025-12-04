import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import swagger from './swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (process.env.NODE_ENV == 'development') swagger(app);

  //Graceful shutdown
  process.on('SIGTERM', async () => {
    await app.close();
  });
  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
