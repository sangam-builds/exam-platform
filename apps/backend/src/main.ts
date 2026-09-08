import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 4000);
  const corsOrigins = configService.get<string[]>('cors.origins', []);

  // Global prefix
  app.setGlobalPrefix('api');

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(createValidationPipe());

  // CORS setup
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('CORS policy: Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  await app.listen(port);
  logger.log(`🚀 Exam Platform Backend running on: http://localhost:${port}/api`);
  logger.log(`🩺 Health check available at: http://localhost:${port}/api/health`);
}

bootstrap();
