import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: ['error', 'warn', 'log']
  });
  
  // Configurar CORS de forma más específica
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Role']
  });

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // Habilitar WebSocket
  const port = process.env.PORT ?? 3001;
  await app.listen(port,'0.0.0.0');
  console.log(`Servidor corriendo en http://localhost:${port}`);
  console.log('WebSocket Gateway activo');
}
bootstrap();
