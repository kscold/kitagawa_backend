import { ApiProperty } from '@nestjs/swagger';

import { StandardResponseDto, PaginatedResponseDto } from '../../../../common/dto/response/standard-response.dto';

/**
 * 제품 기본 정보 DTO (목록용)
 */
export class ProductItemDto {
    @ApiProperty({
        example: '507f1f77bcf86cd799439011',
        description: '제품 ID',
    })
    _id: string;

    @ApiProperty({
        example: 'mr',
        description: '제품 슬러그 (URL 친화적인 고유 식별자)',
    })
    slug: string;

    @ApiProperty({
        example: 'MR Series',
        description: '제품명 (영어)',
    })
    productName: string;

    @ApiProperty({
        example: 'MR 시리즈',
        description: '제품명 (한글)',
    })
    productNameKo: string;

    @ApiProperty({
        example: 'MR series',
        description: '시리즈명',
        required: false,
    })
    series?: string;

    @ApiProperty({
        example: 'Chuck',
        description: '메인 카테고리',
    })
    mainCategory: string;

    @ApiProperty({
        example: 'Hydraulic Hollow Chuck',
        description: '서브 카테고리',
        required: false,
    })
    subCategory?: string;

    @ApiProperty({
        example: 'https://example.com/images/mr-series.jpg',
        description: '제품 이미지 URL',
        required: false,
    })
    imageUrl?: string;

    @ApiProperty({
        example: true,
        description: '추천 제품 여부',
    })
    isFeatured: boolean;

    @ApiProperty({
        example: true,
        description: '활성화 여부',
    })
    isActive: boolean;

    @ApiProperty({
        example: 1250,
        description: '조회수',
    })
    viewCount: number;

    @ApiProperty({
        example: '2025-01-15T10:30:00.000Z',
        description: '생성일',
    })
    createdAt: Date;
}

/**
 * 제품 상세 정보 DTO
 */
export class ProductDetailDto extends ProductItemDto {
    @ApiProperty({
        example: 'High precision hydraulic chuck',
        description: '제품 설명 (영어)',
        required: false,
    })
    description?: string;

    @ApiProperty({
        example: '고정밀 유압 척',
        description: '제품 설명 (한글)',
        required: false,
    })
    descriptionKo?: string;

    @ApiProperty({
        example: 'High clamping force and precision',
        description: '제품 특징 (영어)',
        required: false,
    })
    features?: string;

    @ApiProperty({
        example: '높은 클램핑력과 정밀도',
        description: '제품 특징 (한글)',
        required: false,
    })
    featuresKo?: string;

    @ApiProperty({
        example: ['chuck', 'hydraulic', 'precision'],
        description: '제품 태그',
        isArray: true,
        required: false,
    })
    tags?: string[];

    @ApiProperty({
        example: 'https://youtube.com/watch?v=example',
        description: '유튜브 영상 URL',
        required: false,
    })
    youtubeUrl?: string;

    @ApiProperty({
        example: [
            {
                type: 'PDF',
                url: 'https://example.com/catalog.pdf',
                title: 'Product Catalog',
            },
        ],
        description: '다운로드 파일 목록',
        isArray: true,
        required: false,
    })
    downloads?: Array<{
        type: string;
        url: string;
        title: string;
        titleKo?: string;
        model?: string;
    }>;

    @ApiProperty({
        example: ['mr-related-1', 'mr-related-2'],
        description: '매칭 제품 슬러그 목록',
        isArray: true,
        required: false,
    })
    matchingProducts?: string[];
}

/**
 * 제품 목록 응답
 */
export class ProductListResponseDto extends PaginatedResponseDto<ProductItemDto> {
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
        example: '제품 목록 조회 성공',
        description: '응답 메시지',
    })
    message: string;
}

/**
 * 제품 상세 응답
 */
export class ProductDetailResponseDto extends StandardResponseDto<ProductDetailDto> {
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
        example: '제품 조회 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: ProductDetailDto,
        description: '제품 상세 정보',
    })
    data: ProductDetailDto;
}

/**
 * 제품 배열 응답 (Featured, Popular, Recent)
 */
export class ProductArrayResponseDto extends StandardResponseDto<ProductItemDto[]> {
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
        example: '제품 조회 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: [ProductItemDto],
        description: '제품 목록',
        isArray: true,
    })
    data: ProductItemDto[];
}
