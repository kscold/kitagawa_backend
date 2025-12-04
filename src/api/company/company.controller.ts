import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { CompanyService } from './company.service';

/**
 * Company Public API
 * 인증 없이 접근 가능한 회사 정보 조회 API
 */
@ApiTags('회사 정보')
@Controller('company')
export class CompanyController {
    constructor(private readonly companyService: CompanyService) {}

    /**
     * 회사 정보 조회
     */
    @Get('info')
    @ApiOperation({
        summary: '회사 정보 조회',
        description: `
회사 소개 페이지 정보를 조회합니다.

포함 정보:
- 인사말 (대표 인사말)
- 비전 및 미션
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        schema: {
            example: {
                success: true,
                code: 200,
                message: '회사 정보 조회 성공',
                data: {
                    greeting: {
                        title: 'CEO Greeting',
                        titleKo: '대표 인사말',
                        content: 'Welcome to Korea Kitagawa...',
                        contentKo: '(주) 한국 기타가와를 찾아주셔서 감사합니다...',
                        ceoName: '최민형',
                    },
                    vision: 'To be the leading provider...',
                    visionKo: '대한민국 최고의 정밀 가공 솔루션 제공 기업',
                    mission: 'Provide high-quality products and exceptional customer service',
                    missionKo: '고품질 제품과 탁월한 고객 서비스 제공',
                },
            },
        },
    })
    async getCompanyInfo() {
        const companyInfo = await this.companyService.getCompanyInfo();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '회사 정보 조회 성공',
            data: companyInfo,
        };
    }
}
