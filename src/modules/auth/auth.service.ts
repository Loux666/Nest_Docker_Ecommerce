import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import * as bcrypt from 'bcrypt';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.fullName,
        phone: dto.phone,
        role: 'USER',
        isActive: false,
        otp_code: otp,
        otp_expires_at: otpExpires,
      },
    });

    // Gửi email OTP
    await this.mailService.sendOtpEmail(dto.email, otp);

    return {
      message:
        'Đăng ký thành công, vui lòng kiểm tra email để xác thực tài khoản',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }
    if (user.isActive) {
      throw new BadRequestException('Tài khoản này đã được xác thực rồi');
    }
    if (user.otp_code !== dto.otp) {
      throw new BadRequestException('Mã OTP không chính xác');
    }
    if (!user.otp_expires_at || new Date() > user.otp_expires_at) {
      throw new BadRequestException(
        'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới',
      );
    }
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isActive: true,
        email_verified_at: new Date(),
        otp_code: null,
        otp_expires_at: null,
      },
    });

    //bdau login
    const tokens = await this.generateTokens(user.id, user.role);
    return {
      message: 'Xác thực tài khoản thành công',
      user: { id: user.id, email: user.email, name: user.name },
      tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }

    if (user && !user.isActive) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password || '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Sai mật khẩu');
    }

    const tokens = await this.generateTokens(user.id, user.role);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    // 1. Kiểm tra nếu không có token gửi lên
    if (!refreshToken) {
      throw new UnauthorizedException('Không tìm thấy Refresh Token');
    }

    try {
      // 2. Xác thực và giải mã refreshToken bằng secret bí mật
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      // 3. Kiểm tra xem User trong token có còn tồn tại trong DB không
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException(
          'Tài khoản không tồn tại hoặc đã bị khóa',
        );
      }

      // 4. Sinh ra cặp token mới (Token Rotation - xoay vòng token)
      const tokens = await this.generateTokens(user.id, user.role);

      return tokens;
    } catch (error) {
      // Nếu token hết hạn hoặc sai chữ ký, verifyAsync sẽ văng lỗi vào đây
      throw new UnauthorizedException(
        'Refresh Token không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
