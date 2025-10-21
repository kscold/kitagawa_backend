import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { HomeSettingsService } from './home-settings.service';

/**
 * 홈페이지 설정 Public API
 * 인증 없이 접근 가능한 조회 API
 */
@ApiTags('HomeSettings')
@Controller('home-settings')
export class HomeSettingsController {
    constructor(private readonly homeSettingsService: HomeSettingsService) {}

    /**
     * 홈 설정 조회
     */
    @Get()
    @ApiOperation({
        summary: '홈 설정 조회',
        description: '홈페이지 설정을 조회합니다 (대표 이미지, 소개 텍스트 등)',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '홈 설정 조회 성공',
                data: {
                    mainImages: [
                        {
                            url: 'https://example.com/images/main-banner-1.jpg',
                            order: 0,
                            alt: 'Main Banner 1',
                            altKo: '메인 배너 1',
                        },
                    ],
                    introduction: {
                        title: 'Welcome to Kitagawa',
                        titleKo: '키타가와에 오신 것을 환영합니다',
                        description: 'Leading provider of precision machining solutions',
                        descriptionKo: '정밀 가공 솔루션의 선두 기업',
                    },
                    isActive: true,
                },
            },
        },
    })
    async getSettings() {
        const data = await this.homeSettingsService.getSettings();
        return {
            success: true,
            code: HttpStatus.OK,
            message: '홈 설정 조회 성공',
            data,
        };
    }
}
