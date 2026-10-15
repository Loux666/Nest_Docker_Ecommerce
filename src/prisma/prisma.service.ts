import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Khi ứng dụng NestJS vừa khởi động -> tự động kết nối MySQL
  async onModuleInit() {
    await this.$connect();
    console.log(' [PrismaService] Đã kết nối thành công tới MySQL Database');
  }
  // Khi ứng dụng tắt đi -> tự động ngắt kết nối an toàn
  async onModuleDestroy() {
    await this.$disconnect();
    console.log(' [PrismaService] Đã ngắt kết nối MySQL.');
  }
}
