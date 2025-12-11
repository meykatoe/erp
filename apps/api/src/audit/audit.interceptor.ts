import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SECRET_KEYS = ['password', 'newPassword', 'oldPassword'];

export function redact(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const copy: Record<string, unknown> = { ...(body as object) };
  for (const k of SECRET_KEYS) if (k in copy) copy[k] = '***';
  return copy;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly audit: AuditService) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx.switchToHttp().getRequest();
    if (!WRITE_METHODS.has(req.method)) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => this.write(ctx, 200),
        error: (e) => this.write(ctx, e?.status ?? 500),
      }),
    );
  }

  private write(ctx: ExecutionContext, fallback: number) {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();
    this.audit
      .record({
        userId: req.user?.id ?? null,
        action: req.method,
        entity: req.originalUrl.split('?')[0],
        status: res.statusCode >= 400 ? res.statusCode : fallback,
        payload: redact(req.body) as object,
        ip: req.ip,
      })
      .catch((e) => this.logger.error(`audit failed: ${e.message}`));
  }
}
