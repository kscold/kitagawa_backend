import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * 응답 형식 통일 인터셉터
 *
 * 모든 API 응답을 다음 형식으로 변환:
 * {
 *   success: boolean,
 *   code: number,
 *   message: string,
 *   data: {
 *     items?: T[],        // 페이지네이션 있을 때
 *     pagination?: {...}, // 페이지네이션 있을 때
 *     ...                 // 일반 데이터
 *   }
 * }
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const statusCode = context.switchToHttp().getResponse().statusCode;

        return next.handle().pipe(
            map((data) => {
                // 이미 표준 형식인 경우 (success, code, message, data 모두 있음)
                if (
                    data &&
                    typeof data === 'object' &&
                    'success' in data &&
                    'code' in data &&
                    'message' in data &&
                    'data' in data
                ) {
                    return data;
                }

                // 컨트롤러에서 이미 형식화된 응답 (success, message, data)
                if (data && typeof data === 'object' && 'success' in data && 'message' in data) {
                    const { success, message, data: responseData, total, page, totalPages, ...extraFields } = data;

                    // 페이지네이션 데이터인지 확인 (배열이고 total/page/totalPages 중 하나라도 숫자인 경우)
                    if (
                        Array.isArray(responseData) &&
                        (typeof total === 'number' || typeof page === 'number' || typeof totalPages === 'number')
                    ) {
                        return {
                            success,
                            code: statusCode,
                            message,
                            data: {
                                items: responseData,
                                pagination: {
                                    totalItems: total || 0,
                                    currentPage: page || 1,
                                    totalPages: totalPages || 1,
                                    hasNextPage: (page || 1) < (totalPages || 1),
                                    hasPreviousPage: (page || 1) > 1,
                                },
                            },
                        };
                    }

                    // 일반 데이터
                    return {
                        success,
                        code: statusCode,
                        message,
                        data: responseData,
                    };
                }

                // 원시 데이터인 경우
                return {
                    success: true,
                    code: statusCode,
                    message: '요청이 성공적으로 처리되었습니다',
                    data,
                };
            }),
        );
    }
}
