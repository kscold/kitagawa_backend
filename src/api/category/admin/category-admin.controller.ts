import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse as SwaggerResponse,
    ApiParam,
    ApiBearerAuth,
    ApiBody,
    ApiQuery,
} from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { CategoryAdminService } from './category-admin.service';

import { CategoryLevel } from '../../../schemas/category.schema';

import { CreateCategoryRequestDto } from '../dto/request/create-category-request.dto';
import { UpdateCategoryRequestDto } from '../dto/request/update-category-request.dto';
import { UpdateCategoryOrderRequestDto } from '../dto/request/update-category-order-request.dto';

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
        description: '모든 카테고리 목록을 조회합니다 (비활성화 카테고리 포함)',
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
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    async findAll(@Query('level') level?: CategoryLevel, @Query('isActive') isActive?: boolean) {
        const { categories, total } = await this.categoryAdminService.findAll({
            level,
            isActive: isActive !== undefined ? isActive === true : undefined,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 목록 조회 성공',
            data: {
                categories,
                total,
            },
        };
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
            code: HttpStatus.OK,
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
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
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
        status: HttpStatus.NOT_FOUND,
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
}
