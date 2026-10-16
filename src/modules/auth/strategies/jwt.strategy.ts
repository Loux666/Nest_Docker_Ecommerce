import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      // 1. Tự động trích xuất Token từ Header: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 2. Không bỏ qua token hết hạn (hết hạn là chặn ngay)
      ignoreExpiration: false,
      // 3. Khóa bí mật dùng để kiểm tra chữ ký
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
    });
  }

  // 4. Khi token hợp lệ, hàm validate sẽ được tự động gọi với payload giải mã được
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    // Giá trị return ở đây sẽ được NestJS tự động gán thẳng vào req.user!
    return user;
  }
}
