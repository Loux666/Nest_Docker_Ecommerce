import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // Kích hoạt cơ chế xác thực JWT của Passport
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Nếu có lỗi, hoặc không có user (token sai, hết hạn, không truyền token)
    if (err || !user) {
      throw (
        err ||
        new UnauthorizedException(
          'Vui lòng đăng nhập để thực hiện chức năng này',
        )
      );
    }
    return user;
  }
}
