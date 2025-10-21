import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('Fixi API')
    .setDescription('Marketplace de Servicios Técnicos')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addTag('orders')
    .addTag('payments')
    .addTag('chat')
    .addTag('reviews')
    .addTag('notifications')
    .addTag('billing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Backend running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}

bootstrap();