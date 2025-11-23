import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiBody,
    ApiQuery,
    ApiParam,
    ApiOperation,
    ApiBearerAuth,
    ApiResponse as SwaggerResponse,
} from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { CategoryAdminService } from './category-admin.service';

import { CategoryLevel } from '../../../schemas/category.schema';

import { PaginationQueryDto } from '../../../common/dto/pagination/pagination-query.dto';
import { CreateCategoryRequestDto } from '../dto/request/create-category-request.dto';
import { UpdateCategoryRequestDto } from '../dto/request/update-category-request.dto';
import { UpdateCategoryOrderRequestDto } from '../dto/request/update-category-order-request.dto';
import { ReorderBatchCategoryRequestDto } from '../dto/request/reorder-batch-category-request.dto';
import { ReorderCategoryProductRequestDto } from '../dto/request/reorder-category-product-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';

/**
 * 카테고리 관리자 API
 * 관리자 JWT 인증 필요 (AdminJwtAuthGuard)
 */
@ApiTags('Category - Admin')
@Controller('category-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class CategoryAdminController {
    constructor(private readonly categoryAdminService: CategoryAdminService) {}

    /**
     * 카테고리 목록 조회 (관리자 전용)
     */
    @Get()
    @ApiOperation({
        summary: '카테고리 목록 조회 (관리자)',
        description: '모든 카테고리 목록을 조회합니다 (비활성화 카테고리 포함). 페이지네이션 지원.',
    })
    @ApiQuery({
        name: 'level',
        required: false,
        enum: CategoryLevel,
        description: '카테고리 레벨 필터',
    })
    @ApiQuery({
        name: 'isActive',
        required: false,
        type: Boolean,
        description: '활성화 상태 필터',
    })
    @ApiQuery({
        name: 'page',
        required: false,
        type: Number,
        description: '페이지 번호 (기본값: 없음 - 전체 조회)',
        example: 1,
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: '페이지당 항목 수 (기본값: 10)',
        example: 10,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    async findAll(
        @Query('level') level?: CategoryLevel,
        @Query('isActive') isActive?: boolean,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : 10;
        const pagination = pageNum ? { page: pageNum, limit: limitNum } : undefined;

        return await this.categoryAdminService.findAll(
            {
                level,
                isActive: isActive !== undefined ? isActive === true : undefined,
            },
            pagination,
        );
    }

    /**
     * 카테고리 상세 조회 (관리자 전용)
     */
    @Get(':slug')
    @ApiOperation({
        summary: '카테고리 상세 조회 (관리자)',
        description: 'slug로 카테고리 상세 정보를 조회합니다 (비활성화 카테고리 포함)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    async findBySlug(@Param('slug') slug: string) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 조회 성공',
            data: await this.categoryAdminService.findBySlug(slug),
        };
    }

    /**
     * 카테고리 생성 (관리자 전용)
     */
    @Post()
    @ApiOperation({
        summary: '카테고리 생성',
        description: '새로운 카테고리를 생성합니다 (관리자 인증 필요)',
    })
    @ApiBody({ type: CreateCategoryRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '카테고리 생성 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.CONFLICT,
        description: '중복된 slug',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async create(@Body() categoryData: CreateCategoryRequestDto) {
        return {
            success: true,
            code: HttpStatus.CREATED,
            message: '카테고리가 생성되었습니다',
            data: await this.categoryAdminService.create(categoryData),
        };
    }

    /**
     * 카테고리 수정 (관리자 전용)
     */
    @Patch(':slug')
    @ApiOperation({
        summary: '카테고리 수정',
        description: '카테고리 정보를 수정합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @ApiBody({ type: UpdateCategoryRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '카테고리 수정 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async update(@Param('slug') slug: string, @Body() categoryData: UpdateCategoryRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리가 수정되었습니다',
            data: await this.categoryAdminService.update(slug, categoryData),
        };
    }

    /**
     * 카테고리 삭제 (관리자 전용)
     */
    @Delete(':slug')
    @ApiOperation({
        summary: '카테고리 삭제',
        description: '카테고리를 영구 삭제합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '카테고리 삭제 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '하위 카테고리가 존재하거나 제품이 있어 삭제할 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async delete(@Param('slug') slug: string) {
        await this.categoryAdminService.delete(slug);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리가 삭제되었습니다',
            data: null,
        };
    }

    /**
     * 카테고리 비활성화 (관리자 전용)
     */
    @Patch(':slug/deactivate')
    @ApiOperation({
        summary: '카테고리 비활성화',
        description:
            '카테고리를 비활성화합니다. 비활성화된 카테고리는 일반 사용자에게 노출되지 않습니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '카테고리 비활성화 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '이미 비활성화된 카테고리',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async deactivate(@Param('slug') slug: string) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리가 비활성화되었습니다',
            data: await this.categoryAdminService.deactivate(slug),
        };
    }

    /**
     * 카테고리 활성화 (관리자 전용)
     */
    @Patch(':slug/activate')
    @ApiOperation({
        summary: '카테고리 활성화',
        description: '카테고리를 활성화합니다. 활성화된 카테고리는 일반 사용자에게 노출됩니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '카테고리 활성화 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '이미 활성화된 카테고리',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async activate(@Param('slug') slug: string) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리가 활성화되었습니다',
            data: await this.categoryAdminService.activate(slug),
        };
    }

    /**
     * 카테고리 순서 변경 (관리자 전용)
     */
    @Patch(':slug/order')
    @ApiOperation({
        summary: '카테고리 순서 변경',
        description: '카테고리의 정렬 순서를 변경합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @ApiBody({ type: UpdateCategoryOrderRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 변경 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async updateOrder(@Param('slug') slug: string, @Body() orderData: UpdateCategoryOrderRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 순서가 변경되었습니다',
            data: await this.categoryAdminService.updateOrder(slug, orderData.order),
        };
    }

    /**
     * 카테고리 순서 일괄 변경 (DND용, 관리자 전용)
     */
    @Patch('reorder')
    @ApiOperation({
        summary: '카테고리 순서 일괄 변경 (DND용)',
        description: 'Drag and Drop으로 여러 카테고리의 순서를 한번에 변경합니다 (관리자 인증 필요)',
    })
    @ApiBody({ type: ReorderBatchCategoryRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 일괄 변경 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (카테고리가 존재하지 않거나 레벨이 맞지 않음)',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async reorderBatch(@Body() dto: ReorderBatchCategoryRequestDto) {
        await this.categoryAdminService.reorderBatch(dto.level, dto.parentName, dto.items);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 순서가 일괄 변경되었습니다',
            data: null,
        };
    }

    /**
     * 카테고리에 속한 제품 목록 조회 (관리자 전용)
     */
    @Get(':slug/products')
    @ApiOperation({
        summary: '카테고리에 속한 제품 목록 조회',
        description: '특정 카테고리에 속한 제품 목록을 조회합니다 (순서대로 정렬, 관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async getCategoryProducts(@Param('slug') slug: string, @Query() paginationQuery: PaginationQueryDto) {
        const { products, total, category } = await this.categoryAdminService.getCategoryProducts(slug, {
            limit: paginationQuery.limit,
            skip: paginationQuery.offset,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 제품 목록 조회 성공',
            data: {
                category: {
                    slug: category.slug,
                    name: category.name,
                    level: category.level,
                },
                ...PaginationResponseDto.fromPageLimit(products, total, paginationQuery.page, paginationQuery.limit),
            },
        };
    }

    /**
     * 카테고리 내 제품 순서 일괄 변경 (DND용, 관리자 전용)
     */
    @Patch(':slug/products/reorder')
    @ApiOperation({
        summary: '카테고리 내 제품 순서 일괄 변경 (DND용)',
        description: 'Drag and Drop으로 카테고리 내 제품의 순서를 한번에 변경합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '카테고리 slug', example: 'nc-rotary-table' })
    @ApiBody({ type: ReorderCategoryProductRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 일괄 변경 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (제품이 존재하지 않거나 카테고리에 속하지 않음)',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async reorderCategoryProducts(@Param('slug') slug: string, @Body() dto: ReorderCategoryProductRequestDto) {
        await this.categoryAdminService.reorderCategoryProducts(slug, dto.items);

        return {
            success: true,
            code: HttpStatus.OK,
            message: `${dto.items.length}개 제품의 순서가 업데이트되었습니다`,
            data: null,
        };
    }
}
