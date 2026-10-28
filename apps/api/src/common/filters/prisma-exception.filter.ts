import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(err: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const map: Record<string, [number, string]> = {
      P2002: [HttpStatus.CONFLICT, '資料已存在,欄位值不可重複'],
      P2003: [HttpStatus.CONFLICT, '資料仍被其他紀錄引用'],
      P2025: [HttpStatus.NOT_FOUND, '找不到指定的資料'],
    };
    const [status, message] = map[err.code] ?? [HttpStatus.INTERNAL_SERVER_ERROR, '資料庫發生錯誤'];
    if (status >= 500) this.logger.error(`${err.code}: ${err.message}`);
    res.status(status).json({ statusCode: status, message, code: err.code });
  }
}
