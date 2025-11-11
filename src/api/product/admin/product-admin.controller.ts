import {
    Get,
    Post,
    Body,
    Patch,
    Param,
    Query,
    Delete,
    HttpCode,
    UseGuards,
    HttpStatus,
    Controller,
} from '@nestjs/common';
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

import { ProductAdminService } from './product-admin.service';

import { PaginationQueryDto } from '../../../common/dto/pagination/pagination-query.dto';
import { ReorderBatchDto } from '../dto/request/reorder-batch.dto';
import { UpdateProductOrderDto } from '../dto/request/update-product-order.dto';
import { ProductFilterRequestDto } from '../dto/request/product-filter-request.dto';
import { CreateProductRequestDto } from '../dto/request/create-product-request.dto';
import { UpdateProductRequestDto } from '../dto/request/update-product-request.dto';
import { PaginationResponseDto } from '../../../common/dto/pagination/pagination-response.dto';

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
                code: HttpStatus.OK,
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
    @HttpCode(HttpStatus.OK)
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
        description: '잘못된 요청 (중복된 제품 슬러그 등)',
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
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-r' })
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
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-r' })
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
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-r' })
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
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-r' })
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
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-r' })
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

    /**
     * 카테고리별 제품 목록 조회 (관리자 전용)
     */
    @Get('category/:level')
    @ApiOperation({
        summary: '카테고리별 제품 목록 조회',
        description: '특정 카테고리 레벨의 제품 목록을 조회합니다 (순서대로 정렬)',
    })
    @ApiParam({ name: 'level', description: '카테고리 레벨 (1 또는 2)', enum: ['1', '2'], example: '1' })
    @ApiQuery({ name: 'categorySlug', description: '카테고리 슬러그', example: 'nc-rotary-table' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (유효하지 않은 level 값)',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async findByCategory(
        @Param('level') level: string,
        @Query('categorySlug') categorySlug: string,
        @Query() paginationQuery: PaginationQueryDto,
    ) {
        const levelNum = parseInt(level, 10);

        // level 유효성 검사
        if (levelNum !== 1 && levelNum !== 2) {
            return {
                success: false,
                code: HttpStatus.BAD_REQUEST,
                message: 'level은 1 또는 2여야 합니다',
                data: null,
            };
        }

        const { products, total } = await this.productAdminService.findByCategory(levelNum as 1 | 2, categorySlug, {
            limit: paginationQuery.limit,
            skip: paginationQuery.offset,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리별 제품 목록 조회 성공',
            data: PaginationResponseDto.fromPageLimit(products, total, paginationQuery.page, paginationQuery.limit),
        };
    }

    /**
     * 제품 순서 업데이트 (관리자 전용, DND용)
     */
    @Patch('product/order')
    @ApiOperation({
        summary: '제품 순서 업데이트 (레벨별)',
        description: '특정 카테고리 레벨 내에서 제품의 정렬 순서를 변경합니다 (관리자 인증 필요, DND용)',
    })
    @ApiBody({ type: UpdateProductOrderDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 순서 업데이트 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (유효하지 않은 level, order 값 또는 카테고리 불일치)',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async updateProductOrder(@Body() dto: UpdateProductOrderDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 순서가 업데이트되었습니다',
            data: await this.productAdminService.updateOrderByLevel(dto.slug, dto.level, dto.categorySlug, dto.order),
        };
    }

    /**
     * 여러 제품의 순서를 일괄 변경 (관리자 전용, DND용)
     */
    @Patch('category/reorder')
    @ApiOperation({
        summary: '제품 순서 일괄 변경',
        description: 'DND로 여러 제품의 순서를 한번에 변경합니다 (관리자 인증 필요)',
    })
    @ApiBody({ type: ReorderBatchDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 순서 일괄 변경 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (유효하지 않은 level, order 값 또는 카테고리 불일치)',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async reorderBatch(@Body() dto: ReorderBatchDto) {
        await this.productAdminService.reorderBatch(dto.level, dto.categorySlug, dto.items);

        return {
            success: true,
            code: HttpStatus.OK,
            message: `${dto.items.length}개 제품의 순서가 업데이트되었습니다`,
            data: null,
        };
    }
}
