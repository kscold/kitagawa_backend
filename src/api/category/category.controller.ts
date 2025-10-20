import { Controller, Get, Param, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import {
    CategoryLevel1ListResponseDto,
    CategoryTreeResponseDto,
    CategorySearchResponseDto,
} from './dto/response/category-response.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Get('level1')
    @ApiOperation({
        summary: '대분류 카테고리 목록 조회',
        description: `
홈페이지에 표시할 대분류(Level 1) 카테고리 목록을 조회합니다.

포함 정보:
- 카테고리 기본 정보 (이름, 슬러그, 이미지)
- 제품 수 (productCount)
- 정렬 순서

활성화된 카테고리만 반환됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: CategoryLevel1ListResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '대분류 카테고리 조회 성공',
                data: [
                    {
                        _id: '68f3d059b9aaa2b9a0fb3559',
                        name: 'NC ROTARY TABLE',
                        nameKo: 'NC 로터리 테이블',
                        slug: 'nc-rotary-table',
                        level: 1,
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/data/IMG/catalog.png',
                        order: 0,
                        isActive: true,
                        productCount: 12,
                    },
                    {
                        _id: '68f3d059b9aaa2b9a0fb355a',
                        name: 'Chuck',
                        nameKo: '척',
                        slug: 'chuck',
                        level: 1,
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/data/IMG/chuck.png',
                        order: 1,
                        isActive: true,
                        productCount: 24,
                    },
                ],
            },
        },
    })
    async getLevel1Categories() {
        const data = await this.categoryService.getLevel1Categories();
        return {
            success: true,
            code: HttpStatus.OK,
            message: '대분류 카테고리 조회 성공',
            data,
        };
    }

    @Get('level2/:slug')
    @ApiOperation({
        summary: '특정 대분류의 계층 구조 조회 (슬러그 기반)',
        description: `
특정 대분류 카테고리의 전체 계층 구조를 조회합니다.

반환 정보:
- 대분류 정보
- 중분류(Level 2) 목록
- 각 중분류별 시리즈 정보 (복수 제품인 경우)

제품 페이지의 카테고리 네비게이션에 사용됩니다.
        `,
    })
    @ApiParam({
        name: 'slug',
        description: '카테고리 슬러그 (영어)',
        enum: [
            'nc-rotary-table',
            'nc-rotary-table-4-axis-standard',
            'nc-rotary-table-4-axis-advanced',
            'nc-rotary-table-5-axis-ncrt',
            'nc-rotary-table-related-products',
            'nc-rotary-table-quinte-controller',
            'chuck',
            'chuck-hydraulic-hollow-chuck',
            'chuck-hydraulic-solid-chuck',
            'chuck-scroll-chuck',
            'chuck-design-chuck',
            'chuck-related-products',
            'chuck-other-products',
            'vise',
            'vise-ve-power-vise',
            'vise-vqx-power-vise',
            'vise-special-power-vise',
            'vise-5-axis-power-vise',
            'cylinder',
            'cylinder-hollow-cylinder',
            'cylinder-solid-cylinder',
            'cylinder-special-cylinder',
            'work-gripper',
            'catalogue',
        ],
        example: 'nc-rotary-table',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: CategoryTreeResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '카테고리 계층 구조 조회 성공',
                data: {
                    _id: '68f3d059b9aaa2b9a0fb3559',
                    name: 'NC ROTARY TABLE',
                    nameKo: 'NC 로터리 테이블',
                    slug: 'nc-rotary-table',
                    level: 1,
                    imageUrl: 'https://www.kitagawa.com/en/mtools/item/data/IMG/catalog.png',
                    isActive: true,
                    subCategories: [
                        {
                            _id: '68f3d059b9aaa2b9a0fb3560',
                            name: '4-Axis Standard',
                            nameKo: '4축 표준형',
                            slug: 'nc-rotary-table-4-axis-standard',
                            level: 2,
                            productCount: 5,
                            isActive: true,
                            series: [
                                {
                                    seriesName: 'TT series',
                                    seriesSlug: 'tt',
                                    productCount: 3,
                                },
                            ],
                        },
                    ],
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
        schema: {
            example: {
                success: false,
                code: 404,
                message: '카테고리를 찾을 수 없습니다',
                data: null,
            },
        },
    })
    async getCategoryTree(@Param('slug') slug: string) {
        const data = await this.categoryService.getCategoriesBySlug(slug);

        if (!data) {
            return {
                success: false,
                code: HttpStatus.NOT_FOUND,
                message: '카테고리를 찾을 수 없습니다',
                data: null,
            };
        }

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 계층 구조 조회 성공',
            data,
        };
    }

    @Get('search')
    @ApiOperation({
        summary: '카테고리 검색',
        description: `
키워드로 카테고리를 검색합니다.

검색 대상:
- 카테고리명 (영문/한글)
- 슬러그

검색 결과는 정확도 순으로 정렬됩니다.
        `,
    })
    @ApiQuery({
        name: 'q',
        description: '검색어',
        example: 'chuck',
        required: true,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '검색 성공',
        type: CategorySearchResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '카테고리 검색 성공',
                data: [
                    {
                        _id: '68f3d059b9aaa2b9a0fb355a',
                        name: 'Chuck',
                        nameKo: '척',
                        slug: 'chuck',
                        level: 1,
                        productCount: 24,
                    },
                    {
                        _id: '68f3d059b9aaa2b9a0fb355b',
                        name: 'Hydraulic Hollow Chuck',
                        nameKo: '유압 중공 척',
                        slug: 'chuck-hydraulic-hollow-chuck',
                        level: 2,
                        parentName: 'Chuck',
                        productCount: 8,
                    },
                ],
            },
        },
    })
    async searchCategories(@Query('q') query: string) {
        const data = await this.categoryService.searchCategories(query);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 검색 성공',
            data,
        };
    }
}
