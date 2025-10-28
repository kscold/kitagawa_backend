import { Controller, Get, Param, Query, Post, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ResourceService } from './resource.service';
import { CategoryModel, CategoryDocument } from '../../schemas/category.schema';

import { ResourceFilterDto } from './dto/request/resource-filter.dto';
import {
    ResourceListResponseDto,
    ResourceDetailResponseDto,
    ResourceDownloadResponseDto,
    ResourceTypeStatsResponseDto,
} from './dto/response/resource-response.dto';

/**
 * 자료실 Public API
 * 인증 없이 접근 가능한 조회 API만 제공
 */
@ApiTags('Resources')
@Controller('resources')
export class ResourceController {
    constructor(
        private readonly resourceService: ResourceService,
        @InjectModel(CategoryModel.name)
        private readonly categoryModel: Model<CategoryDocument>,
    ) {}

    /**
     * Level1 카테고리 탭 목록 조회
     */
    @Get('level1')
    @ApiOperation({
        summary: 'Level1 카테고리 탭 목록 조회',
        description: `
자료실 페이지의 카테고리 탭 목록을 조회합니다.

반환되는 카테고리:
- nc-rotary-table: NC ROTARY TABLE
- vise: VISE
- chuck: CHUCK
- cylinder: CYLINDER
- work-gripper: WORK GRIPPER

각 카테고리별 자료 개수도 함께 반환됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '자료실 카테고리 목록 조회 성공',
                data: [
                    {
                        _id: '68f796b7606cfb8026dbff3c',
                        name: 'NC ROTARY TABLE',
                        slug: 'nc-rotary-table',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/MK200R_right.jpg',
                        content: 'Compact & high accuracy Combination with chuck is available.',
                        order: 0,
                        count: 111,
                    },
                    {
                        _id: '68f796b8606cfb8026dbff4e',
                        name: 'VISE',
                        slug: 'vise',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/VE125N_new.jpg',
                        content: 'Toggle joint mechanism Long jaw stroke',
                        order: 1,
                        count: 27,
                    },
                    {
                        _id: '68f796b8606cfb8026dbff5d',
                        name: 'CHUCK',
                        slug: 'chuck',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/BR08_right.jpg',
                        content: "Wide variety of world's standard power chuck",
                        order: 2,
                        count: 243,
                    },
                    {
                        _id: '68f796b9606cfb8026dbff72',
                        name: 'CYLINDER',
                        slug: 'cylinder',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/data/IMG/SR1677C.jpg',
                        content:
                            'High performance Rotary Cylinder is integral to for the operation of a power chuck and extracts the maximum capability of the chuck.',
                        order: 3,
                        count: 42,
                    },
                    {
                        _id: '68f796b9606cfb8026dbff7e',
                        name: 'WORK GRIPPER',
                        slug: 'work-gripper',
                        imageUrl: 'https://www.kitagawa.com/en/mtools/item/itemCatImg07.jpg',
                        content: 'Stationary power chuck with built-in cylinder',
                        order: 4,
                        count: 16,
                    },
                ],
            },
        },
    })
    async getLevel1Categories() {
        // CATALOGUE 제외한 Level 1 카테고리 조회
        const categories = await this.categoryModel
            .find({
                level: 1,
                isActive: true,
                slug: { $ne: 'catalogue' },
            })
            .select('_id name slug imageUrl content order')
            .sort({ order: 1 })
            .lean();

        // 각 카테고리별 자료 개수 조회
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const { total } = await this.resourceService.findAll({
                    category: category.slug,
                    limit: 0,
                    skip: 0,
                });
                return {
                    _id: category._id,
                    name: category.name,
                    slug: category.slug,
                    imageUrl: category.imageUrl,
                    content: category.content,
                    order: category.order,
                    count: total,
                };
            }),
        );

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료실 카테고리 목록 조회 성공',
            data: categoriesWithCount,
        };
    }

    /**
     * Level2 카테고리별 자료 조회
     */
    @Get('level2/:slug')
    @ApiOperation({
        summary: 'Level2 카테고리별 자료 조회',
        description: `
Level2 카테고리(제품군)별 자료를 조회합니다.

카테고리 slug:
- nc-rotary-table: NC ROTARY TABLE
- vise: VISE
- chuck: CHUCK
- cylinder: CYLINDER
- work-gripper: WORK GRIPPER

필터링:
- fileType: 파일 확장자로 필터링 (pdf, dwg)
- keyword: 제목/설명 키워드 검색

페이지네이션:
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 아이템 수 (기본값: 50)

반환 데이터:
- 각 제품의 PDF/DWG 파일들이 별도 아이템으로 반환됩니다
- 프론트엔드에서 metadata.productName + metadata.model로 그룹화하여 사용하세요
        `,
    })
    @ApiParam({
        name: 'slug',
        description: 'Level2 카테고리 slug',
        example: 'nc-rotary-table',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceListResponseDto,
        schema: {
            example: {
                success: true,
                code: 200,
                message: '카테고리별 자료 조회 성공',
                data: {
                    items: [
                        {
                            productName: 'GT series',
                            model: 'GT200',
                            pdfUrl: 'http://prod.kiw.co.jp/mtools/inc/data/PDF/DHP-61E271433.pdf',
                            dwgUrl: 'http://prod.kiw.co.jp/mtools/inc/data/DWG/DHP-61E271433.dwg',
                        },
                        {
                            productName: 'GT series',
                            model: 'GT250',
                            pdfUrl: 'http://prod.kiw.co.jp/mtools/inc/data/PDF/DHP-61E271434.pdf',
                            dwgUrl: 'http://prod.kiw.co.jp/mtools/inc/data/DWG/DHP-61E271434.dwg',
                        },
                    ],
                    pagination: {
                        currentPage: 1,
                        totalPages: 3,
                        totalItems: 56,
                        itemsPerPage: 50,
                        hasNextPage: true,
                        hasPreviousPage: false,
                    },
                },
            },
        },
    })
    async findByLevel2Category(@Param('slug') slug: string, @Query() filterDto: ResourceFilterDto) {
        const { resources } = await this.resourceService.findAll({
            category: slug,
            keyword: filterDto.keyword,
            fileType: filterDto.fileType,
            limit: 0, // 모든 데이터 가져오기
            skip: 0,
        });

        // 모델별로 그룹화
        const modelMap = new Map<
            string,
            {
                productName: string;
                model: string;
                pdfUrl?: string;
                dwgUrl?: string;
            }
        >();

        resources.forEach((resource) => {
            const model = resource.metadata?.model;
            const productName = resource.metadata?.productName;

            // Use productName as fallback if model is not available
            const groupKey = model || productName;

            if (!groupKey || !productName) return;

            if (!modelMap.has(groupKey)) {
                modelMap.set(groupKey, {
                    productName,
                    model: groupKey,
                });
            }

            const entry = modelMap.get(groupKey);
            const fileUrl = resource.file?.url;

            if (fileUrl) {
                if (fileUrl.toLowerCase().endsWith('.pdf')) {
                    entry.pdfUrl = fileUrl;
                } else if (fileUrl.toLowerCase().endsWith('.dwg')) {
                    entry.dwgUrl = fileUrl;
                }
            }
        });

        // Map을 배열로 변환
        const allItems = Array.from(modelMap.values());

        // 페이지네이션 적용
        const page = filterDto.page || 1;
        const limit = filterDto.limit || 50;
        const skip = (page - 1) * limit;
        const paginatedItems = allItems.slice(skip, skip + limit);
        const totalItems = allItems.length;

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리별 자료 조회 성공',
            data: {
                items: paginatedItems,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: limit,
                    hasNextPage: skip + limit < totalItems,
                    hasPreviousPage: page > 1,
                },
            },
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
