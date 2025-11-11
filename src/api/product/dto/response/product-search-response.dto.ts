import { ApiProperty } from '@nestjs/swagger';

/**
 * 제품 검색 결과 아이템 (간소화된 형태)
 */
export class ProductSearchItemDto {
    @ApiProperty({
        example: 'AS series',
        description: '제품명',
    })
    name: string;

    @ApiProperty({
        example: 'as',
        description: '제품 슬러그',
    })
    slug: string;

    @ApiProperty({
        example: 'https://www.kitagawa.com/en/mtools/item/AS_b.jpg',
        description: '제품 이미지 URL',
        required: false,
    })
    imageUrl?: string;
}

/**
 * 페이지네이션 정보
 */
export class PaginationInfo {
    @ApiProperty({
        example: 1,
        description: '현재 페이지',
    })
    currentPage: number;

    @ApiProperty({
        example: 10,
        description: '페이지당 아이템 수',
    })
    itemsPerPage: number;

    @ApiProperty({
        example: 45,
        description: '전체 아이템 수',
    })
    totalItems: number;

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
    hasPreviousPage: boolean;
}

/**
 * 제품 검색 응답 데이터
 */
export class ProductSearchDataDto {
    @ApiProperty({
        type: [ProductSearchItemDto],
        description: '검색된 제품 목록',
    })
    items: ProductSearchItemDto[];

    @ApiProperty({
        type: PaginationInfo,
        description: '페이지네이션 정보',
    })
    pagination: PaginationInfo;
}
