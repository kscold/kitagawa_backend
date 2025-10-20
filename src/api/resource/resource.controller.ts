import { Controller, Get, Param, Query, Post, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam } from '@nestjs/swagger';

import { ResourceService } from './resource.service';

import { ResourceFilterDto } from './dto/request/resource-filter.dto';
import { PaginationResponseDto } from '../../common/dto/pagination/pagination-response.dto';
import {
    ResourceListResponseDto,
    ResourceDetailResponseDto,
    ResourceTypeStatsResponseDto,
    ResourceDownloadResponseDto,
} from './dto/response/resource-response.dto';

/**
 * 자료실 Public API
 * 인증 없이 접근 가능한 조회 API만 제공
 */
@ApiTags('Resources')
@Controller('resources')
export class ResourceController {
    constructor(private readonly resourceService: ResourceService) {}

    /**
     * 자료 목록 조회
     */
    @Get()
    @ApiOperation({
        summary: '자료 목록 조회',
        description: `
자료실 목록을 조회합니다. 타입, 카테고리, 키워드로 필터링 가능합니다.

자료 타입:
- CATALOG: 카탈로그
- MANUAL: 사용 설명서
- TECHNICAL: 기술 자료
- VIDEO: 영상 자료
- BROCHURE: 브로슈어
- CERTIFICATE: 인증서
- OTHER: 기타

필터링:
- type: 자료 타입으로 필터링
- category: 카테고리로 필터링
- keyword: 제목/설명 키워드 검색

페이지네이션:
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 아이템 수 (기본값: 10)
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceListResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '자료 목록 조회 성공',
                data: {
                    items: [
                        {
                            _id: '68ea5e4efb9a341dff2f609d',
                            title: 'NC Rotary Table Catalog 2025',
                            titleKo: 'NC 로터리 테이블 카탈로그 2025',
                            type: 'CATALOG',
                            categories: ['NC ROTARY TABLE', '4-Axis Standard'],
                            tags: ['rotary', 'table', '4-axis'],
                            file: {
                                url: 'https://example.com/files/catalog.pdf',
                                fileName: 'NC_Rotary_Table_Catalog_2025.pdf',
                                fileSize: 2048576,
                                mimeType: 'application/pdf',
                            },
                            thumbnailUrl: 'https://example.com/thumbnails/catalog-thumb.jpg',
                            viewCount: 1250,
                            downloadCount: 450,
                            isActive: true,
                            isFeatured: true,
                            publishedAt: '2025-01-15T00:00:00.000Z',
                            createdAt: '2025-01-15T10:30:00.000Z',
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 5,
                        totalItems: 48,
                        itemsPerPage: 10,
                        hasNextPage: true,
                        hasPreviousPage: false,
                    },
                },
            },
        },
    })
    async findAll(@Query() filterDto: ResourceFilterDto) {
        const { resources, total } = await this.resourceService.findAll({
            type: filterDto.type,
            category: filterDto.category,
            keyword: filterDto.keyword,
            limit: filterDto.limit,
            skip: filterDto.offset,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 목록 조회 성공',
            data: PaginationResponseDto.fromPageLimit(resources, total, filterDto.page, filterDto.limit),
        };
    }

    /**
     * 자료 타입별 통계 조회
     */
    @Get('stats/types')
    @ApiOperation({
        summary: '자료 타입별 통계',
        description: `
각 자료 타입별 자료 수를 조회합니다.

반환되는 타입:
- CATALOG: 카탈로그
- MANUAL: 사용 설명서
- TECHNICAL: 기술 자료
- VIDEO: 영상 자료
- BROCHURE: 브로슈어
- CERTIFICATE: 인증서
- OTHER: 기타

자료실 필터 UI에 사용됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceTypeStatsResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '자료 타입별 통계 조회 성공',
                data: [
                    {
                        type: 'CATALOG',
                        count: 25,
                    },
                    {
                        type: 'MANUAL',
                        count: 18,
                    },
                    {
                        type: 'TECHNICAL',
                        count: 12,
                    },
                    {
                        type: 'VIDEO',
                        count: 8,
                    },
                    {
                        type: 'BROCHURE',
                        count: 5,
                    },
                ],
            },
        },
    })
    async getResourceTypeStats() {
        const stats = await this.resourceService.getResourceTypeStats();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 타입별 통계 조회 성공',
            data: stats,
        };
    }

    /**
     * ID로 자료 조회
     */
    @Get(':id')
    @ApiOperation({
        summary: '자료 상세 조회',
        description: `
ID로 특정 자료의 상세 정보를 조회합니다.

조회 시 자동으로 viewCount가 1 증가합니다.

포함 정보:
- 기본 정보 (제목, 타입, 카테고리)
- 파일 정보 (URL, 파일명, 크기)
- 통계 (조회수, 다운로드 수)
- 메타데이터
        `,
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '68ea5e4efb9a341dff2f609d',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceDetailResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '자료 조회 성공',
                data: {
                    _id: '68ea5e4efb9a341dff2f609d',
                    title: 'NC Rotary Table Catalog 2025',
                    titleKo: 'NC 로터리 테이블 카탈로그 2025',
                    description: 'Comprehensive catalog for NC Rotary Table series',
                    descriptionKo: 'NC 로터리 테이블 시리즈 종합 카탈로그',
                    type: 'CATALOG',
                    categories: ['NC ROTARY TABLE', '4-Axis Standard'],
                    tags: ['rotary', 'table', '4-axis'],
                    file: {
                        url: 'https://example.com/files/catalog.pdf',
                        fileName: 'NC_Rotary_Table_Catalog_2025.pdf',
                        fileSize: 2048576,
                        mimeType: 'application/pdf',
                    },
                    thumbnailUrl: 'https://example.com/thumbnails/catalog-thumb.jpg',
                    previewUrl: null,
                    viewCount: 1251,
                    downloadCount: 450,
                    isActive: true,
                    isFeatured: true,
                    order: 0,
                    publishedAt: '2025-01-15T00:00:00.000Z',
                    metadata: { version: '2.0', language: 'en' },
                    createdAt: '2025-01-15T10:30:00.000Z',
                    updatedAt: '2025-01-15T10:30:00.000Z',
                },
            },
        },
    })
    async findById(@Param('id') id: string) {
        const resource = await this.resourceService.findById(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 조회 성공',
            data: resource,
        };
    }

    /**
     * 다운로드 수 증가
     */
    @Post(':id/download')
    @ApiOperation({
        summary: '다운로드 수 증가',
        description: `
자료 다운로드 시 다운로드 수를 증가시킵니다.

사용 시나리오:
1. 사용자가 다운로드 버튼 클릭
2. 프론트엔드에서 이 API 호출
3. downloadCount가 1 증가
4. 실제 파일 다운로드 진행

통계 집계에 사용됩니다.
        `,
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '68ea5e4efb9a341dff2f609d',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '증가 성공',
        type: ResourceDownloadResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '다운로드 수 증가 성공',
            },
        },
    })
    async incrementDownloadCount(@Param('id') id: string) {
        await this.resourceService.incrementDownloadCount(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '다운로드 수 증가 성공',
        };
    }
}
