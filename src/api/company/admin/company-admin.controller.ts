import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, HttpStatus, ParseIntPipe } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse as SwaggerResponse,
    ApiBearerAuth,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { CompanyAdminService } from './company-admin.service';

import { UpdateCompanyInfoRequestDto } from '../dto/request/update-company-info-request.dto';
import { UpdateGreetingRequestDto } from '../dto/request/update-greeting-request.dto';
import { CreateHistoryItemDto } from '../dto/request/create-history-item.dto';
import { CreateCertificationItemDto } from '../dto/request/create-certification-item.dto';

/**
 * Company Admin API
 * 관리자 전용 회사 정보 관리 API
 */
@ApiTags('Company - Admin')
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
    @ApiBody({ type: UpdateCompanyInfoRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    async updateCompanyInfo(@Body() updateDto: UpdateCompanyInfoRequestDto) {
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
    @ApiBody({ type: UpdateGreetingRequestDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    async updateGreeting(@Body() greetingDto: UpdateGreetingRequestDto) {
        const data = await this.companyAdminService.updateGreeting(greetingDto);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '인사말이 수정되었습니다',
            data,
        };
    }

    @Post('history')
    @ApiOperation({
        summary: '연혁 추가',
        description: '회사 연혁을 추가합니다',
    })
    @ApiBody({ type: CreateHistoryItemDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '추가 성공',
    })
    async addHistory(@Body() historyDto: CreateHistoryItemDto) {
        const data = await this.companyAdminService.addHistory(historyDto);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '연혁이 추가되었습니다',
            data,
        };
    }

    @Delete('history/:index')
    @ApiOperation({
        summary: '연혁 삭제',
        description: '회사 연혁을 삭제합니다',
    })
    @ApiParam({
        name: 'index',
        description: '연혁 배열 인덱스',
        example: 0,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '삭제 성공',
    })
    async deleteHistory(@Param('index', ParseIntPipe) index: number) {
        const data = await this.companyAdminService.deleteHistory(index);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '연혁이 삭제되었습니다',
            data,
        };
    }

    @Post('certifications')
    @ApiOperation({
        summary: '인증서 추가',
        description: '회사 인증서를 추가합니다',
    })
    @ApiBody({ type: CreateCertificationItemDto })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '추가 성공',
    })
    async addCertification(@Body() certDto: CreateCertificationItemDto) {
        const data = await this.companyAdminService.addCertification(certDto);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '인증서가 추가되었습니다',
            data,
        };
    }

    @Delete('certifications/:index')
    @ApiOperation({
        summary: '인증서 삭제',
        description: '회사 인증서를 삭제합니다',
    })
    @ApiParam({
        name: 'index',
        description: '인증서 배열 인덱스',
        example: 0,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '삭제 성공',
    })
    async deleteCertification(@Param('index', ParseIntPipe) index: number) {
        const data = await this.companyAdminService.deleteCertification(index);
        return {
            success: true,
            code: HttpStatus.OK,
            message: '인증서가 삭제되었습니다',
            data,
        };
    }
}
