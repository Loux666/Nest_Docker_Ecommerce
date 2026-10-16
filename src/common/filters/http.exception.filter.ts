import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Err httpexception -> lay ra status, nguoc lai la 500
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[500] ${request.method} ${request.url} - Error:`,
        exception instanceof Error ? exception.stack : exception,
      );
      return response.status(status).json({
        message: 'Đã có lỗi xảy ra ở server',
      });
    }

    const exceptionResponse = (exception as HttpException).getResponse();
    // Chuẩn hóa nếu exceptionResponse là string hoặc object
    if (typeof exceptionResponse === 'string') {
      return response.status(status).json({
        message: exceptionResponse,
      });
    }
    const resObj = exceptionResponse as Record<string, any>;
    return response.status(status).json({
      message: resObj.message || 'Lỗi không xác định',
      code: resObj.code,
      errors: resObj.errors,
      details: resObj.details,
    });
  }
}
