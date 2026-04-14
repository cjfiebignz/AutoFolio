import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true, // In development, allow any origin to support LAN/Mobile testing
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // AutoFolio runs on port 3001
  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');

  logger.log(`AutoFolio API is running on: http://localhost:${port}`);
}
bootstrap();