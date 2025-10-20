import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, HttpStatus } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse as SwaggerResponse,
    ApiParam,
    ApiBearerAuth,
    ApiBody,
} from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';
import { HomeSettingsAdminService } from './home-settings-admin.service';
import { UpdateHomeIntroductionRequestDto } from '../dto/request/update-home-introduction-request.dto';
import { AddMainImageRequestDto } from '../dto/request/add-main-image-request.dto';
import { UpdateImageOrderRequestDto } from '../dto/request/update-image-order-request.dto';

/**
 * 홈페이지 설정 관리자 API
 * 관리자 JWT 인증 필요 (AdminJwtAuthGuard)
 */
@ApiTags('HomeSettings - Admin')
@Controller('home-settings-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class HomeSettingsAdminController {
    constructor(private readonly homeSettingsAdminService: HomeSettingsAdminService) {}

    /**
     * 홈 설정 조회 (관리자 전용)
     */
    @Get()
    @ApiOperation({
        summary: '홈 설정 조회 (관리자)',
        description: '홈페이지 설정을 조회합니다 (대표 이미지, 소개 텍스트 등)',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    async getSettings() {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '홈 설정 조회 성공',
            data: await this.homeSettingsAdminService.getSettings(),
        };
    }

    /**
     * 홈 소개 업데이트 (관리자 전용)
     */
    @Patch('introduction')
    @ApiOperation({
        summary: '홈 소개 업데이트',
        description: '홈페이지 소개 텍스트를 업데이트합니다 (관리자 인증 필요)',
    })
    @ApiBody({ type: UpdateHomeIntroductionRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '업데이트 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async updateIntroduction(@Body() introductionData: UpdateHomeIntroductionRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '홈 소개가 업데이트되었습니다',
            data: await this.homeSettingsAdminService.updateIntroduction(introductionData),
        };
    }

    /**
     * 대표 이미지 추가 (관리자 전용)
     */
    @Post('main-images')
    @ApiOperation({
        summary: '대표 이미지 추가',
        description: '홈페이지 대표 이미지를 추가합니다 (최대 5개, 관리자 인증 필요)',
    })
    @ApiBody({ type: AddMainImageRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '이미지 추가 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '최대 개수 초과 또는 중복 이미지',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async addMainImage(@Body() imageData: AddMainImageRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '대표 이미지가 추가되었습니다',
            data: await this.homeSettingsAdminService.addMainImage(imageData),
        };
    }

    /**
     * 대표 이미지 삭제 (관리자 전용)
     */
    @Delete('main-images/:imageUrl')
    @ApiOperation({
        summary: '대표 이미지 삭제',
        description: '홈페이지 대표 이미지를 삭제합니다 (관리자 인증 필요)',
    })
    @ApiParam({
        name: 'imageUrl',
        description: '이미지 URL (URL 인코딩 필요)',
        example: 'https%3A%2F%2Fexample.com%2Fimage.jpg',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '이미지 삭제 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '이미지를 찾을 수 없음',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async removeMainImage(@Param('imageUrl') imageUrl: string) {
        // URL 디코딩
        const decodedUrl = decodeURIComponent(imageUrl);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '대표 이미지가 삭제되었습니다',
            data: await this.homeSettingsAdminService.removeMainImage(decodedUrl),
        };
    }

    /**
     * 이미지 순서 변경 (관리자 전용)
     */
    @Patch('main-images/order')
    @ApiOperation({
        summary: '이미지 순서 변경',
        description: '대표 이미지의 순서를 변경합니다 (드래그앤드롭, 관리자 인증 필요)',
    })
    @ApiBody({ type: UpdateImageOrderRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '순서 변경 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '잘못된 요청 (존재하지 않는 이미지 또는 개수 불일치)',
    })
    @SwaggerResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: '인증 실패',
    })
    async updateImageOrder(@Body() orderData: UpdateImageOrderRequestDto) {
        return {
            success: true,
            code: HttpStatus.OK,
            message: '이미지 순서가 변경되었습니다',
            data: await this.homeSettingsAdminService.updateImageOrder(orderData.imageUrls),
        };
    }
}
