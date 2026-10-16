import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    // Đọc file .env toàn cục
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule, // Database
    MailModule,   // Gửi email
    AuthModule,   // Xác thực & JWT
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
