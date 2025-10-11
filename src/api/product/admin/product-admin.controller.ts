import { Controller, Post, Patch, Delete, Param, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { ProductService } from '../product.service';

/**
 * 제품 관리자 API
 * 관리자 JWT 인증 필요 (AdminJwtAuthGuard)
 */
@ApiTags('Product - Admin')
@Controller('product-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class ProductAdminController {
    constructor(private readonly productService: ProductService) {}

    /**
     * 제품 생성 (관리자 전용)
     */
    @Post()
    @ApiOperation({
        summary: '제품 생성',
        description: '새로운 제품을 생성합니다 (관리자 인증 필요)',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '제품 생성 성공',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async create(@Body() productData: any) {
        const product = await this.productService.create(productData);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 생성되었습니다',
            data: product,
        };
    }

    /**
     * 제품 업데이트 (관리자 전용)
     */
    @Patch(':productCode')
    @ApiOperation({
        summary: '제품 수정',
        description: '제품 정보를 수정합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '제품 수정 성공',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async update(@Param('productCode') productCode: string, @Body() productData: any) {
        const product = await this.productService.update(productCode, productData);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 수정되었습니다',
            data: product,
        };
    }

    /**
     * 제품 삭제 (관리자 전용)
     */
    @Delete(':productCode')
    @ApiOperation({
        summary: '제품 삭제',
        description: '제품을 삭제합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '제품 삭제 성공',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async delete(@Param('productCode') productCode: string) {
        await this.productService.delete(productCode);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 삭제되었습니다',
        };
    }

    /**
     * 제품 비활성화 (관리자 전용)
     */
    @Patch(':productCode/deactivate')
    @ApiOperation({
        summary: '제품 비활성화',
        description: '제품을 비활성화합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '제품 비활성화 성공',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async deactivate(@Param('productCode') productCode: string) {
        const product = await this.productService.deactivate(productCode);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 비활성화되었습니다',
            data: product,
        };
    }

    /**
     * 제품 활성화 (관리자 전용)
     */
    @Patch(':productCode/activate')
    @ApiOperation({
        summary: '제품 활성화',
        description: '제품을 활성화합니다 (관리자 인증 필요)',
    })
    @ApiParam({ name: 'productCode', description: '제품 코드' })
    @ApiResponse({
        status: HttpStatus.OK,
        description: '제품 활성화 성공',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async activate(@Param('productCode') productCode: string) {
        const product = await this.productService.activate(productCode);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '제품이 활성화되었습니다',
            data: product,
        };
    }
}
