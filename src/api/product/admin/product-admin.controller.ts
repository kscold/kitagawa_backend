import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse as SwaggerResponse,
    ApiParam,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';
import { PaginationQueryDto } from '../../../common/dto/pagination/pagination-query.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';
import { ProductFilterRequestDto } from '../dto/request/product-filter-request.dto';
import { CreateProductRequestDto } from '../dto/request/create-product-request.dto';
import { UpdateProductRequestDto } from '../dto/request/update-product-request.dto';

import { ProductAdminService } from './product-admin.service';

/**
 * 제품 관리자 API
 * 관리자 JWT 인증 필요 (AdminJwtAuthGuard)
 */
@ApiTags('Product - Admin')
@Controller('product-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class ProductAdminController {
    constructor(private readonly productAdminService: ProductAdminService) {}

    /**
     * 제품 목록 조회 (관리자 전용)
     */
    @Get()
    @ApiOperation({
        summary: '제품 목록 조회 (관리자)',
        description: '모든 제품 목록을 조회합니다 (비활성화 제품 포함)',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '제품 목록 조회 성공',
                data: {
                    items: [],
                    pagination: {
                        currentPage: 1,
                        totalPages: 1,
                        totalItems: 0,
                        itemsPerPage: 10,
                        hasNextPage: false,
                        hasPreviousPage: false,
                    },
                },
            },
        },
    })
    async findAll(@Query() paginationQuery: PaginationQueryDto, @Query() filterDto: ProductFilterRequestDto) {
        const { products, total } = await this.productAdminService.findAll({
            ...filterDto,
            limit: paginationQuery.limit,
            skip: paginationQuery.offset,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 목록 조회 성공',
            data: PaginationResponseDto.fromPageLimit(products, total, paginationQuery.page, paginationQuery.limit),
        };
    }

    /**
     * 제품 생성 (관리자 전용)
     */
    @Post()
    @ApiOperation({
        summary: '제품 생성',
        description: '새로운 제품을 생성합니다 (관리자 인증 필요)',
    })
    @ApiBody({ type: CreateProductRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 생성 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (중복된 제품 코드 등)',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async create(@Body() productData: CreateProductRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 생성되었습니다',
            data: await this.productAdminService.create(productData),
        };
    }

    /**
     * 제품 조회 (관리자 전용)
     */
    @Get(':slug')
    @ApiOperation({
        summary: '제품 상세 조회 (관리자)',
        description: '제품 슬러그로 상세 정보를 조회합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-ckr-series' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async findOne(@Param('slug') slug: string) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 조회 성공',
            data: await this.productAdminService.findBySlug(slug),
        };
    }

    /**
     * 제품 업데이트 (관리자 전용)
     */
    @Patch(':slug')
    @ApiOperation({
        summary: '제품 수정',
        description: '제품 정보를 수정합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-ckr-series' })
    @ApiBody({ type: UpdateProductRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 수정 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async update(@Param('slug') slug: string, @Body() productData: UpdateProductRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 수정되었습니다',
            data: await this.productAdminService.update(slug, productData),
        };
    }

    /**
     * 제품 삭제 (관리자 전용)
     */
    @Delete(':slug')
    @ApiOperation({
        summary: '제품 삭제',
        description: '제품을 영구 삭제합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-ckr-series' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 삭제 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async delete(@Param('slug') slug: string) {
        await this.productAdminService.delete(slug);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 삭제되었습니다',
            data: null,
        };
    }

    /**
     * 제품 비활성화 (관리자 전용)
     */
    @Patch(':slug/deactivate')
    @ApiOperation({
        summary: '제품 비활성화',
        description: '제품을 비활성화합니다. 비활성화된 제품은 일반 사용자에게 노출되지 않습니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-ckr-series' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 비활성화 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '이미 비활성화된 제품',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async deactivate(@Param('slug') slug: string) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 비활성화되었습니다',
            data: await this.productAdminService.deactivate(slug),
        };
    }

    /**
     * 제품 활성화 (관리자 전용)
     */
    @Patch(':slug/activate')
    @ApiOperation({
        summary: '제품 활성화',
        description: '제품을 활성화합니다. 활성화된 제품은 일반 사용자에게 노출됩니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-ckr-series' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 활성화 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '이미 활성화된 제품',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async activate(@Param('slug') slug: string) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 활성화되었습니다',
            data: await this.productAdminService.activate(slug),
        };
    }
}
