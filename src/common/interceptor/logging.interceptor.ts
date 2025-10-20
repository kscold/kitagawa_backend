import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * API 호출 로깅 인터셉터
 *
 * 모든 HTTP 요청/응답을 로깅합니다:
 * - 요청: Method, URL, Query, Body, IP
 * - 응답: Status Code, 처리 시간
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        const { method, url, query, body, ip, headers } = request;
        const startTime = Date.now();

        // Query 파라미터
        const queryString = Object.keys(query).length > 0 ? JSON.stringify(query, null, 2) : '';

        // Authorization 토큰 (GET 요청일 때)
        const authToken = headers.authorization || headers.Authorization || '';
        const tokenDisplay = authToken ? `Bearer ${authToken.substring(0, 20)}...` : '';

        // Body (POST/PATCH/PUT 요청일 때)
        const bodyString =
            ['POST', 'PATCH', 'PUT'].includes(method) && Object.keys(body || {}).length > 0
                ? JSON.stringify(body, null, 2)
                : '';

        // 로그 메시지 생성
        let logMessage = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Incoming Request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Method: ${method}
  URL: ${url}
  IP: ${ip}`;

        // Query 추가
        if (queryString) {
            logMessage += `\n  Query: ${queryString}`;
        }

        // GET 요청이면 토큰 표시
        if (method === 'GET' && tokenDisplay) {
            logMessage += `\n  Authorization: ${tokenDisplay}`;
        }

        // POST/PATCH/PUT 요청이면 Body 표시
        if (bodyString) {
            logMessage += `\n  Body: ${bodyString}`;
        }

        logMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        this.logger.log(logMessage);

        return next.handle().pipe(
            tap({
                next: (data) => {
                    const { statusCode } = response;
                    const responseTime = Date.now() - startTime;

                    // 응답 로그
                    this.logger.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
← Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Method: ${method}
  URL: ${url}
  Status: ${statusCode}
  Time: ${responseTime}ms
  Success: ${data?.success || 'N/A'}
  Message: ${data?.message || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
                },
                error: (error) => {
                    const responseTime = Date.now() - startTime;
                    const statusCode = error.status || 500;

                    // 에러 로그
                    this.logger.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✖ Error Response
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Method: ${method}
  URL: ${url}
  Status: ${statusCode}
  Time: ${responseTime}ms
  Error: ${error.message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
                },
            }),
        );
    }
}
