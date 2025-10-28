import { Controller, Get, Patch, Delete, Body, Param, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { ContactAdminService } from './contact-admin.service';
import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { ContactAdminFilterDto } from './dto/request/contact-admin-filter.dto';
import { UpdateContactStatusDto } from './dto/request/update-contact-status.dto';
import { ContactAdminDetailResponseDto, ContactAdminListResponseDto } from './dto/response/contact-admin-response.dto';

/**
 * 문의 Admin API
 * 문의 관리 (조회, 상태 업데이트, 삭제)
 */
@ApiTags('Contact Admin')
@Controller('contact-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class ContactAdminController {
    constructor(private readonly contactAdminService: ContactAdminService) {}

    /**
     * 문의 목록 조회
     */
    @Get()
    @ApiOperation({
        summary: '문의 목록 조회',
        description: `
문의 목록을 조회합니다.

필터링:
- keyword: 담당자명, 업체명, 이메일, 메시지 검색
- status: 처리 상태 (PENDING, IN_PROGRESS, COMPLETED, REJECTED)

페이지네이션:
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 아이템 수 (기본값: 20)

최신 문의가 먼저 표시됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ContactAdminListResponseDto,
    })
    async findAll(@Query() filterDto: ContactAdminFilterDto) {
        const { contacts, pagination } = await this.contactAdminService.findAll(filterDto);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '문의 목록 조회 성공',
            data: {
                items: contacts,
                pagination,
            },
        };
    }

    /**
     * 문의 상세 조회
     */
    @Get(':id')
    @ApiOperation({
        summary: '문의 상세 조회',
        description: 'ID로 문의 상세 정보를 조회합니다.',
    })
    @ApiParam({
        name: 'id',
        description: '문의 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ContactAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '문의를 찾을 수 없습니다',
    })
    async findById(@Param('id') id: string) {
        const contact = await this.contactAdminService.findById(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '문의 조회 성공',
            data: contact,
        };
    }

    /**
     * 문의 상태 업데이트
     */
    @Patch(':id/status')
    @ApiOperation({
        summary: '문의 상태 업데이트',
        description: `
문의 처리 상태를 업데이트합니다.

상태 종류:
- PENDING: 대기 중 (초기 상태)
- IN_PROGRESS: 처리 중
- COMPLETED: 완료
- REJECTED: 거절

관리자 메모를 추가할 수 있습니다.
COMPLETED나 REJECTED로 변경 시 자동으로 처리 완료 시간이 기록됩니다.
        `,
    })
    @ApiParam({
        name: 'id',
        description: '문의 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '업데이트 성공',
        type: ContactAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '문의를 찾을 수 없습니다',
    })
    async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateContactStatusDto) {
        const contact = await this.contactAdminService.updateStatus(id, updateDto);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '문의 상태 업데이트 성공',
            data: contact,
        };
    }

    /**
     * 문의 삭제
     */
    @Delete(':id')
    @ApiOperation({
        summary: '문의 삭제',
        description: '문의를 삭제합니다. 일반적으로는 상태를 REJECTED로 변경하는 것을 권장하지만, 필요한 경우 완전히 삭제할 수 있습니다.',
    })
    @ApiParam({
        name: 'id',
        description: '문의 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '삭제 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '문의를 찾을 수 없습니다',
    })
    async delete(@Param('id') id: string) {
        await this.contactAdminService.delete(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '문의 삭제 성공',
        };
    }
}
