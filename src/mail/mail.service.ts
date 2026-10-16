import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly configService: ConfigService) {
    // Khởi tạo transporter từ biến môi trường .env
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: false, // true nếu dùng port 465, false cho port 587/2525
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  // Hàm gửi mã xác thực OTP
  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    try {
      const mailFrom = this.configService.get<string>('MAIL_FROM');
      await this.transporter.sendMail({
        from: mailFrom,
        to,
        subject: `[Rya's Store] Mã xác thực OTP của bạn: ${otp}`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 8px;">
              <h2 style="color: #333; text-align: center;">MÃ XÁC THỰC TÀI KHOẢN</h2>
              <p>Xin chào,</p>
              <p>Mã OTP của bạn là:</p>
              <div style="text-align: center; margin: 25px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; background: #EEF2FF; padding: 10px 20px; border-radius: 6px;">
                  ${otp}
                </span>
              </div>
              <p style="color: #666; font-size: 14px;">Mã này có hiệu lực trong vòng <b>5 phút</b>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
            </div>
          </div>
        `,
      });
      this.logger.log(` Đã gửi email OTP tới ${to}`);
      return true;
    } catch (error) {
      this.logger.error(` Lỗi khi gửi mail tới ${to}:`, error);
      return false;
    }
  }
}
