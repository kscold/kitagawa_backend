import { ApiProperty } from '@nestjs/swagger';

/**
 * 서브카테고리 + 제품 목록 DTO
 */
export class SubCategoryWithProductsDto {
    @ApiProperty({ description: '서브카테고리 ID', example: '68f796b9606cfb8026dbff66' })
    _id: string;

    @ApiProperty({ description: '서브카테고리명', example: '스크롤 척' })
    name: string;

    @ApiProperty({ description: '서브카테고리명 (한글)', example: '스크롤 척' })
    nameKo: string;

    @ApiProperty({ description: '서브카테고리 slug', example: 'chuck-scroll-chuck' })
    slug: string;

    @ApiProperty({ description: '정렬 순서', example: 1 })
    order: number;

    @ApiProperty({ description: '활성화 여부', example: true })
    isActive: boolean;

    @ApiProperty({ description: '제품 개수', example: 7 })
    productCount: number;

    @ApiProperty({ description: '제품 목록', type: 'array' })
    products: any[];
}

/**
 * 카테고리 정보 DTO
 */
export class CategoryInfoDto {
    @ApiProperty({ description: '카테고리 ID', example: '68f796b8606cfb8026dbff5d' })
    _id: string;

    @ApiProperty({ description: '카테고리명', example: 'CHUCK' })
    name: string;

    @ApiProperty({ description: '카테고리명 (한글)', example: 'CHUCK' })
    nameKo: string;

    @ApiProperty({ description: '카테고리 slug', example: 'chuck' })
    slug: string;

    @ApiProperty({ description: '카테고리 레벨', example: 1 })
    level: number;

    @ApiProperty({ description: '정렬 순서', example: 2 })
    order: number;

    @ApiProperty({ description: '활성화 여부', example: true })
    isActive: boolean;

    @ApiProperty({ description: '제품 개수', example: 40 })
    productCount: number;

    @ApiProperty({
        description: '이미지 URL',
        example: 'https://www.kitagawa.com/en/mtools/item/BR08_right.jpg',
        required: false,
    })
    imageUrl?: string;

    @ApiProperty({ description: '설명', example: "Wide variety of world's standard power chuck", required: false })
    description?: string;
}

/**
 * 카테고리 + 서브카테고리 + 제품 목록 응답 DTO
 */
export class CategoryWithProductsResponseDto {
    @ApiProperty({ description: '카테고리 정보', type: CategoryInfoDto })
    category: CategoryInfoDto;

    @ApiProperty({ description: '서브카테고리 목록', type: [SubCategoryWithProductsDto] })
    subCategories: SubCategoryWithProductsDto[];

    @ApiProperty({ description: '총 서브카테고리 수', example: 4 })
    totalSubCategories: number;

    @ApiProperty({ description: '총 제품 수', example: 40 })
    totalProducts: number;
}
