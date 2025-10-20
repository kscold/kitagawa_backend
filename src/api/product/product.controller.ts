import { Controller, Get, Param, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam } from '@nestjs/swagger';

import { ProductService } from './product.service';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination/pagination-query.dto';
import { SearchProductQueryDto } from './dto/request/search-product-query.dto';
import {
    ProductListResponseDto,
    ProductDetailResponseDto,
    ProductArrayResponseDto,
} from './dto/response/product-list-response.dto';

/**
 * 제품 Public API
 * 인증 없이 접근 가능한 조회 API만 제공
 *
 * 디자인 기반 필수 API만 포함:
 * 1. 제품 검색
 * 2. 제품 상세 조회
 * 3. 시리즈별 제품 조회 (복수 제품인 경우)
 */
@ApiTags('Products')
@Controller('products')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    /**
     * 제품 검색 (영어, 한글, 자음 지원)
     */
    @Get('search')
    @ApiOperation({
        summary: '제품 검색',
        description: `
제품을 검색합니다. 다양한 검색 방식을 지원합니다:
- 영어 검색: "chuck", "MR", "rotary"
- 한글 검색: "척", "회전", "유압"
- 자음 검색: "ㅊㅋ" → "척" 매칭
- 부분 검색: "rot" → "rotary" 매칭

검색 대상:
- 제품명 (영어/한글)
- 제품 코드
- 시리즈명
- 카테고리명
- 태그

정확도 순으로 정렬됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '검색 성공',
        type: ProductListResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '제품 검색 성공',
                data: {
                    items: [
                        {
                            _id: '507f1f77bcf86cd799439011',
                            productName: 'MR Series',
                            productNameKo: 'MR 시리즈',
                            productCode: 'mr',
                            series: 'MR series',
                            mainCategory: 'Chuck',
                            subCategory: 'Hydraulic Hollow Chuck',
                            imageUrl: 'https://example.com/images/mr-series.jpg',
                            isFeatured: true,
                            isActive: true,
                            viewCount: 1250,
                            createdAt: '2025-01-15T10:30:00.000Z',
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 5,
                        totalItems: 50,
                        itemsPerPage: 10,
                        hasNextPage: true,
                        hasPreviousPage: false,
                    },
                },
            },
        },
    })
    async searchProducts(@Query() searchQuery: SearchProductQueryDto) {
        const { products, total } = await this.productService.searchProducts(searchQuery.keyword, {
            category: searchQuery.category,
            subCategory: searchQuery.subCategory,
            limit: searchQuery.limit,
            skip: searchQuery.offset,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 검색 성공',
            data: PaginationResponseDto.fromPageLimit(products, total, searchQuery.page, searchQuery.limit),
        };
    }

    /**
     * 시리즈별 제품 조회
     */
    @Get('series/:seriesSlug')
    @ApiOperation({
        summary: '시리즈별 제품 조회',
        description:
            '특정 시리즈의 제품 목록을 조회합니다 (인증 불필요). 현재는 단종 제품 시리즈만 복수 제품을 가집니다.',
    })
    @ApiParam({
        name: 'seriesSlug',
        description: '시리즈 슬러그',
        example: 'information-on-discontinued-products',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ProductListResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '시리즈별 제품 조회 성공',
                data: {
                    items: [
                        {
                            _id: '507f1f77bcf86cd799439011',
                            productName: 'Discontinued Chuck 1',
                            productNameKo: '단종 척 1',
                            productCode: 'dc-001',
                            series: 'information-on-discontinued-products',
                            mainCategory: 'Chuck',
                            subCategory: 'Hydraulic Chuck',
                            imageUrl: 'https://example.com/images/dc-001.jpg',
                            isFeatured: false,
                            isActive: true,
                            viewCount: 450,
                            createdAt: '2024-05-10T08:00:00.000Z',
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 3,
                        totalItems: 25,
                        itemsPerPage: 10,
                        hasNextPage: true,
                        hasPreviousPage: false,
                    },
                },
            },
        },
    })
    async findBySeries(@Param('seriesSlug') seriesSlug: string, @Query() paginationQuery: PaginationQueryDto) {
        const { products, total } = await this.productService.findBySeries(seriesSlug, {
            limit: paginationQuery.limit,
            skip: paginationQuery.offset,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '시리즈별 제품 조회 성공',
            data: PaginationResponseDto.fromPageLimit(products, total, paginationQuery.page, paginationQuery.limit),
        };
    }

    /**
     * 추천 제품 조회 (홈페이지용)
     */
    @Get('featured')
    @ApiOperation({
        summary: '추천 제품 조회',
        description: `
홈페이지에 표시할 추천 제품 목록을 조회합니다.

특징:
- isFeatured가 true인 제품만 반환
- 기본 8개 제품 반환 (limit으로 조정 가능)
- 최신순 정렬
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ProductArrayResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '추천 제품 조회 성공',
                data: [
                    {
                        _id: '507f1f77bcf86cd799439011',
                        productName: 'MR Series',
                        productNameKo: 'MR 시리즈',
                        productCode: 'mr',
                        series: 'MR series',
                        mainCategory: 'Chuck',
                        subCategory: 'Hydraulic Hollow Chuck',
                        imageUrl: 'https://example.com/images/mr-series.jpg',
                        isFeatured: true,
                        isActive: true,
                        viewCount: 1250,
                        createdAt: '2025-01-15T10:30:00.000Z',
                    },
                    {
                        _id: '507f1f77bcf86cd799439012',
                        productName: 'BB Series',
                        productNameKo: 'BB 시리즈',
                        productCode: 'bb',
                        series: 'BB series',
                        mainCategory: 'Chuck',
                        subCategory: 'Power Chuck',
                        imageUrl: 'https://example.com/images/bb-series.jpg',
                        isFeatured: true,
                        isActive: true,
                        viewCount: 980,
                        createdAt: '2025-01-14T14:20:00.000Z',
                    },
                ],
            },
        },
    })
    async getFeaturedProducts(@Query('limit') limit?: number) {
        const products = await this.productService.getFeaturedProducts(limit || 8);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '추천 제품 조회 성공',
            data: products,
        };
    }

    /**
     * 인기 제품 조회 (조회수 기준)
     */
    @Get('popular')
    @ApiOperation({
        summary: '인기 제품 조회',
        description: `
조회수가 많은 인기 제품 목록을 조회합니다.

특징:
- viewCount 기준 내림차순 정렬
- 기본 8개 제품 반환 (limit으로 조정 가능)
- 홈페이지 인기 제품 섹션에 사용
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ProductArrayResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '인기 제품 조회 성공',
                data: [
                    {
                        _id: '507f1f77bcf86cd799439013',
                        productName: 'Popular Product 1',
                        productNameKo: '인기 제품 1',
                        productCode: 'pp-001',
                        series: 'PP series',
                        mainCategory: 'Chuck',
                        subCategory: 'Power Chuck',
                        imageUrl: 'https://example.com/images/pp-001.jpg',
                        isFeatured: false,
                        isActive: true,
                        viewCount: 5420,
                        createdAt: '2024-12-20T09:00:00.000Z',
                    },
                ],
            },
        },
    })
    async getPopularProducts(@Query('limit') limit?: number) {
        const products = await this.productService.getPopularProducts(limit || 8);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '인기 제품 조회 성공',
            data: products,
        };
    }

    /**
     * 최신 제품 조회
     */
    @Get('recent')
    @ApiOperation({
        summary: '최신 제품 조회',
        description: `
최근에 등록된 제품 목록을 조회합니다.

특징:
- 등록일(createdAt) 기준 내림차순 정렬
- 기본 8개 제품 반환 (limit으로 조정 가능)
- 홈페이지 신제품 섹션에 사용
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ProductArrayResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '최신 제품 조회 성공',
                data: [
                    {
                        _id: '507f1f77bcf86cd799439014',
                        productName: 'New Product 1',
                        productNameKo: '신제품 1',
                        productCode: 'np-001',
                        series: 'NP series',
                        mainCategory: 'Chuck',
                        subCategory: 'Hydraulic Chuck',
                        imageUrl: 'https://example.com/images/np-001.jpg',
                        isFeatured: false,
                        isActive: true,
                        viewCount: 120,
                        createdAt: '2025-01-20T15:30:00.000Z',
                    },
                ],
            },
        },
    })
    async getRecentProducts(@Query('limit') limit?: number) {
        const products = await this.productService.getRecentProducts(limit || 8);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '최신 제품 조회 성공',
            data: products,
        };
    }

    /**
     * 제품 코드로 조회 (제품 상세 페이지)
     */
    @Get('code/:productCode')
    @ApiOperation({
        summary: '제품 상세 조회',
        description: `
제품 코드로 특정 제품의 상세 정보를 조회합니다 (인증 불필요).

포함 정보:
- 제품 기본 정보 (이름, 코드, 이미지)
- 제품 설명 및 스펙
- 다운로드 링크 (PDF, DXF, STEP 등)
- 매칭 제품 (관련 제품)
- 유튜브 영상 URL
        `,
    })
    @ApiParam({
        name: 'productCode',
        description: '제품 코드',
        example: 'mr',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ProductDetailResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '제품 조회 성공',
                data: {
                    _id: '507f1f77bcf86cd799439011',
                    productName: 'MR Series',
                    productNameKo: 'MR 시리즈',
                    productCode: 'mr',
                    series: 'MR series',
                    mainCategory: 'Chuck',
                    subCategory: 'Hydraulic Hollow Chuck',
                    imageUrl: 'https://example.com/images/mr-series.jpg',
                    isFeatured: true,
                    isActive: true,
                    viewCount: 1250,
                    createdAt: '2025-01-15T10:30:00.000Z',
                    description: 'High precision hydraulic chuck with excellent clamping force',
                    descriptionKo: '뛰어난 클램핑력을 가진 고정밀 유압 척',
                    features: 'High clamping force, Precision machining, Durable construction',
                    featuresKo: '높은 클램핑력, 정밀 가공, 내구성 있는 구조',
                    tags: ['chuck', 'hydraulic', 'precision'],
                    youtubeUrl: 'https://youtube.com/watch?v=example',
                    downloads: [
                        {
                            type: 'PDF',
                            url: 'https://example.com/catalog/mr-series.pdf',
                            title: 'Product Catalog',
                            titleKo: '제품 카탈로그',
                            model: 'MR-100',
                        },
                    ],
                    matchingProducts: ['bb', 'nb-210'],
                },
            },
        },
    })
    async findByCode(@Param('productCode') productCode: string) {
        const product = await this.productService.findByCode(productCode);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 조회 성공',
            data: product,
        };
    }
}
