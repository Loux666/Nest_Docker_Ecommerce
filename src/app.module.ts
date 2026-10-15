import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Đọc file .env toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, // 👈 Đăng ký PrismaModule tại đây
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
