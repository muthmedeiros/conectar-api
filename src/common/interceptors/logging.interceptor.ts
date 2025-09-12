import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request & { user?: any }>();
        const res = context.switchToHttp().getResponse();
        const method = (req as any).method;
        const url = (req as any).originalUrl || (req as any).url;

        const start = process.hrtime.bigint();

        const userId = (req as any).user?.id ?? '-';
        const role = (req as any).user?.role ?? '-';

        return next.handle().pipe(
            finalize(() => {
                const end = process.hrtime.bigint();
                const durationMs = Number(end - start) / 1e6;
                const statusCode = (res as any).statusCode;

                this.logger.log(
                    `${method} ${url} -> ${statusCode} ${durationMs.toFixed(1)}ms (user=${userId}, role=${role})`,
                );
            }),
        );
    }
}
