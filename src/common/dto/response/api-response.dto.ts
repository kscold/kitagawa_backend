import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

/**
 * 표준 API 응답 래퍼
 * 모든 API 응답은 이 형식을 따릅니다
 *
 * 구조:
 * {
 *   success: boolean,
 *   code: number,
 *   message: string,
 *   data?: T
 * }
 */
export class ApiResponseDto<T = any> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: HttpStatus.OK,
        description: 'HTTP 상태 코드',
    })
    code: number;

    @ApiProperty({
        example: '요청이 성공적으로 처리되었습니다',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        description: '응답 데이터',
        required: false,
    })
    data?: T;

    constructor(success: boolean, code: number, message: string, data?: T) {
        this.success = success;
        this.code = code;
        this.message = message;
        if (data !== undefined) {
            this.data = data;
        }
    }

    /**
     * 성공 응답 생성
     */
    static success<T>(message: string, data?: T, code: number = HttpStatus.OK): ApiResponseDto<T> {
        return new ApiResponseDto(true, code, message, data);
    }

    /**
     * 생성 성공 응답 (201)
     */
    static created<T>(message: string, data?: T): ApiResponseDto<T> {
        return new ApiResponseDto(true, HttpStatus.CREATED, message, data);
    }

    /**
     * 에러 응답 생성
     */
    static error(message: string, code: number = HttpStatus.BAD_REQUEST): ApiResponseDto {
        return new ApiResponseDto(false, code, message);
    }
}

/**
 * 페이지네이션 정보가 포함된 API 응답
 */
export class ApiPaginatedResponseDto<T = any> extends ApiResponseDto<{
    items: T[];
    pagination: {
        totalItems: number;
        currentPage: number;
        pageSize: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}> {
    constructor(
        success: boolean,
        code: number,
        message: string,
        items: T[],
        pagination: {
            totalItems: number;
            currentPage: number;
            pageSize: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        },
    ) {
        super(success, code, message, { items, pagination });
    }

    /**
     * 페이지네이션 성공 응답 생성
     */
    static paginated<T>(
        message: string,
        items: T[],
        pagination: {
            totalItems: number;
            currentPage: number;
            pageSize: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        },
        code: number = HttpStatus.OK,
    ): ApiPaginatedResponseDto<T> {
        return new ApiPaginatedResponseDto(true, code, message, items, pagination);
    }
}
