import { ApiProperty } from '@nestjs/swagger';

/**
 * 페이지네이션 정보
 */
export class PaginationInfo {
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
        description: '한 페이지에 보여질 데이터 수',
    })
    pageSize: number;

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
    hasPrevPage: boolean;
}

/**
 * 페이지네이션 응답 DTO
 *
 * 사용 예시:
 * return PaginationResponseDto.of(products, total, page, totalPages, '제품 목록 조회 성공');
 */
export class PaginationResponseDto<T> {
    @ApiProperty({
        description: '현재 페이지 아이템 목록',
        isArray: true,
    })
    items: T[];

    @ApiProperty({
        description: '페이지네이션 정보',
        type: PaginationInfo,
    })
    pagination: PaginationInfo;

    private constructor(items: T[], pagination: PaginationInfo) {
        this.items = items;
        this.pagination = pagination;
    }

    /**
     * 페이지네이션 응답 생성 (빌더 패턴)
     *
     * @param items 아이템 배열
     * @param totalItems 전체 아이템 개수
     * @param currentPage 현재 페이지 (1부터 시작)
     * @param totalPages 전체 페이지 개수
     * @param pageSize 한 페이지에 보여질 데이터 수
     * @returns { items, pagination } 구조의 객체
     */
    static of<T>(
        items: T[],
        totalItems: number,
        currentPage: number,
        totalPages: number,
        pageSize: number,
    ): { items: T[]; pagination: PaginationInfo } {
        return {
            items,
            pagination: {
                totalItems,
                currentPage,
                pageSize,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1,
            },
        };
    }

    /**
     * limit과 skip으로 페이지네이션 응답 생성
     *
     * @param items 아이템 배열
     * @param totalItems 전체 아이템 개수
     * @param limit 페이지 크기
     * @param skip 건너뛸 개수
     */
    static fromLimitSkip<T>(
        items: T[],
        totalItems: number,
        limit: number,
        skip: number,
    ): { items: T[]; pagination: PaginationInfo } {
        const currentPage = Math.floor(skip / limit) + 1;
        const totalPages = Math.ceil(totalItems / limit);

        return PaginationResponseDto.of(items, totalItems, currentPage, totalPages, limit);
    }

    /**
     * page와 limit으로 페이지네이션 응답 생성
     *
     * @param items 아이템 배열
     * @param totalItems 전체 아이템 개수
     * @param page 현재 페이지 (1부터 시작)
     * @param limit 페이지 크기
     */
    static fromPageLimit<T>(
        items: T[],
        totalItems: number,
        page: number,
        limit: number,
    ): { items: T[]; pagination: PaginationInfo } {
        const totalPages = Math.ceil(totalItems / limit);

        return PaginationResponseDto.of(items, totalItems, page, totalPages, limit);
    }
}
