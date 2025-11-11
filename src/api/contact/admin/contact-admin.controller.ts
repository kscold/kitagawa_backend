import { Controller, Get, Patch, Delete, Body, Param, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { ContactAdminService } from './contact-admin.service';

import { ContactAdminFilterDto } from './dto/request/contact-admin-filter.dto';
import { UpdateContactStatusDto } from './dto/request/update-contact-status.dto';
import { UpdateContactInfoRequestDto } from './dto/request/update-contact-info-request.dto';
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
        description:
            '문의를 삭제합니다. 일반적으로는 상태를 REJECTED로 변경하는 것을 권장하지만, 필요한 경우 완전히 삭제할 수 있습니다.',
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
            data: null,
        };
    }

    /**
     * 회사 연락처 정보 조회 (관리자용)
     */
    @Get('info/contact')
    @ApiOperation({
        summary: '회사 연락처 정보 조회 (관리자)',
        description: `
회사 연락처 정보를 조회합니다. (관리자 전용)

포함 정보:
- 회사명, 대표자
- 본사 주소
- 전화번호, 팩스, 이메일
- 지점/서비스센터 목록
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '회사 정보를 찾을 수 없습니다',
    })
    async getContactInfo() {
        const contactInfo = await this.contactAdminService.getContactInfo();

        return {
            success: true,
            code: HttpStatus.OK,
            message: '회사 연락처 정보 조회 성공',
            data: contactInfo,
        };
    }

    /**
     * 회사 연락처 정보 수정 (관리자용)
     */
    @Patch('info/contact')
    @ApiOperation({
        summary: '회사 연락처 정보 수정 (관리자)',
        description: `
회사 연락처 정보를 수정합니다. (관리자 전용)

수정 가능 정보:
- 회사명, 대표자
- 본사 주소
- 전화번호, 휴대전화, 팩스, 이메일, 웹사이트
- 지점/서비스센터 목록 (위치, 연락처, 지도 좌표)

Singleton 패턴으로 작동하며, 문서가 없으면 자동으로 생성됩니다.
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
    })
    async updateContactInfo(@Body() updateDto: UpdateContactInfoRequestDto) {
        const contactInfo = await this.contactAdminService.updateContactInfo(updateDto);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '회사 연락처 정보 수정 성공',
            data: contactInfo,
        };
    }
}
