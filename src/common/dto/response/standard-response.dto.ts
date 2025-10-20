import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * 표준 API 응답 형식
 * Swagger가 자동으로 타입을 인식하도록 설계
 */
export class StandardResponseDto<T = any> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: 200,
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
}

/**
 * 페이지네이션 메타 정보
 */
export class PaginationMetaDto {
    @ApiProperty({
        example: 100,
        description: '전체 아이템 개수',
    })
    totalItems: number;

    @ApiProperty({
        example: 1,
        description: '현재 페이지 번호 (1부터 시작)',
    })
    currentPage: number;

    @ApiProperty({
        example: 20,
        description: '페이지당 아이템 수',
    })
    pageSize: number;

    @ApiProperty({
        example: 5,
        description: '전체 페이지 수',
    })
    totalPages: number;

    @ApiProperty({
        example: true,
        description: '다음 페이지 존재 여부',
    })
    hasNextPage: boolean;

    @ApiProperty({
        example: false,
        description: '이전 페이지 존재 여부',
    })
    hasPrevPage: boolean;
}

/**
 * 페이지네이션 데이터 래퍼
 */
export class PaginatedDataDto<T> {
    @ApiProperty({
        description: '현재 페이지 아이템 목록',
        isArray: true,
    })
    items: T[];

    @ApiProperty({
        description: '페이지네이션 메타 정보',
        type: PaginationMetaDto,
    })
    pagination: PaginationMetaDto;
}

/**
 * 페이지네이션 응답 DTO
 */
export class PaginatedResponseDto<T> extends StandardResponseDto<PaginatedDataDto<T>> {
    @ApiProperty({
        description: '응답 데이터',
    })
    data: PaginatedDataDto<T>;
}

/**
 * 생성 응답 DTO (201)
 */
export class CreatedResponseDto<T = any> extends StandardResponseDto<T> {
    @ApiProperty({
        example: 201,
        description: 'HTTP 상태 코드',
    })
    code: number;
}

/**
 * ID만 반환하는 생성 응답
 */
export class IdResponseDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: '생성된 리소스 ID',
    })
    _id: string;
}
