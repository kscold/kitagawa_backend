import { Get, Body, Patch, Param, Query, UseGuards, HttpStatus, Controller } from '@nestjs/common';
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

import { UpdateProductFilesDto } from '../dto/request/update-product-files.dto';

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
     * Level 1 카테고리 목록 조회 (메인 제품 설정)
     */
    @Get('level1')
    @ApiOperation({
        summary: 'Level 1 카테고리 목록 조회',
        description: '메인 제품 설정 페이지용 - NC ROTARY TABLE, VISE, CHUCK, CYLINDER, WORK GRIPPER 목록',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async findLevel1Categories() {
        const data = await this.productAdminService.findLevel1Categories();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 목록 조회 성공',
            data,
        };
    }

    /**
     * Level 1 카테고리 순서 변경 (DND용)
     */
    @Patch('level1/reorder')
    @ApiOperation({
        summary: 'Level 1 카테고리 순서 일괄 변경',
        description: '메인 제품 설정 페이지의 DND를 위한 순서 변경 API',
    })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            slug: { type: 'string', example: 'chuck' },
                            order: { type: 'number', example: 0 },
                        },
                    },
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 변경 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async reorderLevel1Categories(@Body() body: { items?: { slug: string; order: number }[] }) {
        if (!body || !body.items || !Array.isArray(body.items)) {
            return {
                success: false,
                code: HttpStatus.BAD_REQUEST,
                message: 'items 배열이 필요합니다',
                data: null,
            };
        }

        await this.productAdminService.reorderLevel1Categories(body.items);

        // 업데이트된 카테고리 목록 조회
        const data = await this.productAdminService.findLevel1Categories();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리 순서가 업데이트되었습니다',
            data,
        };
    }

    /**
     * Level 2 서브카테고리 목록 조회 (관리자 전용)
     */
    @Get('level2/:categorySlug')
    @ApiOperation({
        summary: 'Level 2 서브카테고리 목록 조회 (DND용)',
        description: '상위 카테고리 정보와 하위 서브카테고리 목록을 반환합니다 (DND 구현용)',
    })
    @ApiParam({ name: 'categorySlug', description: '상위 카테고리 슬러그', example: 'chuck' })
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
    async findLevel2Categories(@Param('categorySlug') categorySlug: string) {
        const data = await this.productAdminService.findCategoryWithSubCategories(categorySlug);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '서브카테고리 목록 조회 성공',
            data,
        };
    }

    /**
     * Level 1 카테고리 개별 수정
     */
    @Patch('level1/:slug')
    @ApiOperation({
        summary: 'Level 1 카테고리 정보 수정',
        description: '상위 카테고리의 이름, 설명, 이미지 등을 수정합니다',
    })
    @ApiParam({ name: 'slug', description: '카테고리 슬러그', example: 'chuck' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: 'CHUCK' },
                content: { type: 'string', example: "Wide variety of world's standard power chuck" },
                imageUrl: { type: 'string', example: 'https://...' },
                isActive: { type: 'boolean', example: true },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '카테고리를 찾을 수 없음',
    })
    async updateLevel1Category(
        @Param('slug') slug: string,
        @Body()
        body: {
            name?: string;
            content?: string;
            imageUrl?: string;
            isActive?: boolean;
        },
    ) {
        const data = await this.productAdminService.updateLevel1Category(slug, body);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '카테고리가 수정되었습니다',
            data,
        };
    }

    /**
     * Level 2 서브카테고리 순서 변경 (DND용)
     */
    @Patch('level2/:categorySlug/reorder')
    @ApiOperation({
        summary: 'Level 2 서브카테고리 순서 일괄 변경',
        description: '상위 제품 설정 페이지의 중간 카테고리 DND를 위한 순서 변경 API',
    })
    @ApiParam({ name: 'categorySlug', description: '상위 카테고리 슬러그', example: 'chuck' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            slug: { type: 'string', example: 'chuck-hydraulic-hollow-chuck' },
                            order: { type: 'number', example: 0 },
                        },
                    },
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 변경 성공',
    })
    async reorderLevel2Categories(
        @Param('categorySlug') categorySlug: string,
        @Body() body: { items?: { slug: string; order: number }[] },
    ) {
        if (!body || !body.items || !Array.isArray(body.items)) {
            return {
                success: false,
                code: HttpStatus.BAD_REQUEST,
                message: 'items 배열이 필요합니다',
                data: null,
            };
        }

        await this.productAdminService.reorderSubCategories(body.items);

        // 업데이트된 카테고리 정보 조회
        const data = await this.productAdminService.findCategoryWithSubCategories(categorySlug);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '서브카테고리 순서가 업데이트되었습니다',
            data,
        };
    }

    /**
     * Level 2 서브카테고리 개별 수정
     */
    @Patch('level2/:slug')
    @ApiOperation({
        summary: 'Level 2 서브카테고리 정보 수정',
        description: '서브카테고리의 이름, 설명, 이미지 등을 수정합니다',
    })
    @ApiParam({ name: 'slug', description: '서브카테고리 슬러그', example: 'chuck-hydraulic-hollow-chuck' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string', example: '유압 중공척' },
                content: { type: 'string', example: 'Hydraulic hollow chuck description' },
                imageUrl: { type: 'string', example: 'https://...' },
                isActive: { type: 'boolean', example: true },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '서브카테고리를 찾을 수 없음',
    })
    async updateLevel2Category(
        @Param('slug') slug: string,
        @Body()
        body: {
            name?: string;
            content?: string;
            imageUrl?: string;
            isActive?: boolean;
        },
    ) {
        const data = await this.productAdminService.updateLevel2Category(slug, body);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '서브카테고리가 수정되었습니다',
            data,
        };
    }

    /**
     * Level 3 제품 목록 조회 (관리자 전용, 페이지네이션)
     */
    @Get('level3/:subCategorySlug')
    @ApiOperation({
        summary: 'Level 3 제품 목록 조회 (DND용)',
        description: '서브카테고리 정보와 해당 제품 목록을 페이지네이션과 함께 반환합니다',
    })
    @ApiParam({ name: 'subCategorySlug', description: '서브카테고리 슬러그', example: 'chuck-related-products' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호 (기본값: 1)', example: 1 })
    @ApiQuery({
        name: 'limit',
        required: false,
        type: Number,
        description: '페이지당 항목 수 (기본값: 20)',
        example: 20,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '서브카테고리를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async findLevel3Products(
        @Param('subCategorySlug') subCategorySlug: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;

        const data = await this.productAdminService.findSubCategoryWithProducts(subCategorySlug, {
            page: pageNum,
            limit: limitNum,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '서브카테고리 제품 목록 조회 성공',
            data,
        };
    }

    /**
     * Level 3 제품 순서 변경 (DND용)
     */
    @Patch('level3/:subCategorySlug/reorder')
    @ApiOperation({
        summary: 'Level 3 제품 순서 일괄 변경',
        description: '서브카테고리 내 제품의 순서를 일괄 변경합니다 (DND용)',
    })
    @ApiParam({ name: 'subCategorySlug', description: '서브카테고리 슬러그', example: 'chuck-related-products' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                items: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            slug: { type: 'string', example: 'product-1' },
                            order: { type: 'number', example: 0 },
                        },
                    },
                },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 변경 성공',
    })
    async reorderLevel3Products(
        @Param('subCategorySlug') subCategorySlug: string,
        @Body() body: { items?: { slug: string; order: number }[] },
    ) {
        if (!body || !body.items || !Array.isArray(body.items)) {
            return {
                success: false,
                code: HttpStatus.BAD_REQUEST,
                message: 'items 배열이 필요합니다',
                data: null,
            };
        }

        await this.productAdminService.reorderProducts(subCategorySlug, body.items);

        // 업데이트된 제품 목록 조회
        const data = await this.productAdminService.findSubCategoryWithProducts(subCategorySlug, {
            page: 1,
            limit: 100,
        });

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 순서가 업데이트되었습니다',
            data,
        };
    }

    /**
     * Level 3 제품 개별 수정
     */
    @Patch('level3/:slug')
    @ApiOperation({
        summary: 'Level 3 제품 정보 수정',
        description: '제품의 이름, 이미지, 설명 등을 수정합니다',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'ck-r' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productTitle: { type: 'string', example: 'CK-R Series' },
                productName: { type: 'string', example: 'CK-R' },
                mainImageUrl: { type: 'string', example: 'https://...' },
                description: { type: 'string', example: 'Product description' },
                content: { type: 'string', example: 'Product content' },
                contentDetail: { type: 'string', example: 'Detailed content' },
                isActive: { type: 'boolean', example: true },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    async updateLevel3Product(
        @Param('slug') slug: string,
        @Body()
        body: {
            productTitle?: string;
            productName?: string;
            mainImageUrl?: string;
            description?: string;
            content?: string;
            contentDetail?: string;
            isActive?: boolean;
        },
    ) {
        const data = await this.productAdminService.updateLevel3Product(slug, body);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 수정되었습니다',
            data,
        };
    }

    /**
     * 단일 제품 상세 조회
     */
    @Get('products/:slug')
    @ApiOperation({
        summary: '단일 제품 상세 조회',
        description: '제품 slug로 단일 제품의 모든 상세 정보를 조회합니다',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'mr' })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async getProductBySlug(@Param('slug') slug: string) {
        const data = await this.productAdminService.getProductBySlug(slug);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 조회 성공',
            data,
        };
    }

    /**
     * 단일 제품 정보 수정
     */
    @Patch('products/:slug')
    @ApiOperation({
        summary: '단일 제품 정보 수정',
        description: '제품의 이름, 이미지, 설명 등을 수정합니다',
    })
    @ApiParam({ name: 'slug', description: '제품 슬러그', example: 'mr' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                productTitle: { type: 'string', example: 'MR Series' },
                productName: { type: 'string', example: 'MR' },
                mainImageUrl: { type: 'string', example: 'https://...' },
                description: { type: 'string', example: 'Product description' },
                content: { type: 'string', example: 'Product content' },
                contentDetail: { type: 'string', example: 'Detailed content' },
                isActive: { type: 'boolean', example: true },
            },
        },
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    async updateProduct(
        @Param('slug') slug: string,
        @Body()
        body: {
            productTitle?: string;
            productName?: string;
            mainImageUrl?: string;
            description?: string;
            content?: string;
            contentDetail?: string;
            isActive?: boolean;
        },
    ) {
        const data = await this.productAdminService.updateLevel3Product(slug, body);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 수정되었습니다',
            data,
        };
    }

    /**
     * 제품 자료 파일 업데이트 (관리자 전용)
     */
    @Patch(':slug/files')
    @ApiOperation({
        summary: '제품 자료 파일 업데이트',
        description: '제품 자료 파일(PDF, DWG 등)을 업데이트합니다. CDN URL을 전송합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'slug', description: '제품 slug', example: 'br-series' })
    @ApiBody({ type: UpdateProductFilesDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '제품 자료 업데이트 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '제품을 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async updateFiles(@Param('slug') slug: string, @Body() dto: UpdateProductFilesDto) {
        const updated = await this.productAdminService.updateProductFiles(slug, dto.files);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품 자료가 업데이트되었습니다',
            data: updated,
        };
    }
}
