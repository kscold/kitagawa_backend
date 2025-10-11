import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 응답 DTO
 */
export class PaginationResponseDto<T> {
    @ApiProperty({
        description: '현재 페이지 아이템 목록',
        isArray: true,
    })
    items: T[];

    @ApiProperty({
        example: 100,
        description: '전체 아이템 개수',
    })
    totalItems: number;

    @ApiProperty({
        example: 1,
        description: '현재 페이지 번호',
    })
    currentPage: number;

    @ApiProperty({
        example: 10,
        description: '전체 페이지 개수',
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
    hasPreviousPage: boolean;

    constructor(items: T[], totalItems: number, currentPage: number, totalPages: number) {
        this.items = items;
        this.totalItems = totalItems;
        this.currentPage = currentPage;
        this.totalPages = totalPages;
        this.hasNextPage = currentPage < totalPages;
        this.hasPreviousPage = currentPage > 1;
    }
}
