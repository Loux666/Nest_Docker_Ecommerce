import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  exports: [MailService], // 👈 Mở cửa cho AuthModule và OrderModule dùng ké
})
export class MailModule {}
