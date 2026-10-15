import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 👈 Giúp PrismaService dùng được ở TẤT CẢ các module khác mà không cần import lại
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Xuất PrismaService ra ngoài
})
export class PrismaModule {}
