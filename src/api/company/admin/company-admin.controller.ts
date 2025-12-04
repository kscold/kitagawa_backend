import { Controller, Get, Patch, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBody, ApiOperation, ApiBearerAuth, ApiResponse as SwaggerResponse } from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { CompanyAdminService } from './company-admin.service';

import { CompanyGreetingUpdateRequestDto } from './dto/request/company-greeting-update-request.dto';
import { CompanyUpdateInfoRequestDto } from './dto/request/company-update-info-request.dto';

/**
 * Company Admin API
 * 관리자 전용 회사 정보 관리 API
 */
@ApiTags('회사 정보 관리자')
@Controller('company-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class CompanyAdminController {
    constructor(private readonly companyAdminService: CompanyAdminService) {}

    @Get()
    @ApiOperation({
        summary: '회사 정보 조회 (관리자)',
        description: '회사 정보를 조회합니다 (관리자 전용)',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    async getCompanyInfo() {
        const data = await this.companyAdminService.getCompanyInfo();
        return {
            success: true,
            code: HttpStatus.OK,
            message: '회사 정보 조회 성공',
            data,
        };
    }

    @Patch()
    @ApiOperation({
        summary: '회사 기본 정보 수정',
        description: 'Vision, Mission 등 회사 기본 정보를 수정합니다',
    })
    @ApiBody({ type: CompanyUpdateInfoRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    async updateCompanyInfo(@Body() updateDto: CompanyUpdateInfoRequestDto) {
        const data = await this.companyAdminService.updateCompanyInfo(updateDto);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '회사 정보가 수정되었습니다',
            data,
        };
    }

    @Patch('greeting')
    @ApiOperation({
        summary: '인사말 수정',
        description: 'CEO 인사말을 수정합니다',
    })
    @ApiBody({ type: CompanyGreetingUpdateRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    async updateGreeting(@Body() greetingDto: CompanyGreetingUpdateRequestDto) {
        const data = await this.companyAdminService.updateGreeting(greetingDto);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '인사말이 수정되었습니다',
            data,
        };
    }
}
