import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //Kich hoat Exception filter cho global
  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các field không khai báo trong DTO
      transform: true, // Tự động convert kiểu dữ liệu (vd: string '123' -> number 123)
    }),
  );

  //  Cấu hình tài liệu Swagger (tự sinh UI test API)
  const config = new DocumentBuilder()
    .setTitle("Rya's Store E-Commerce API")
    .setDescription('Tài liệu API Backend NestJS chuẩn kiến trúc Modular')
    .setVersion('1.0')
    .addBearerAuth() // Cho phép nhập JWT Bearer token trên Swagger UI
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
