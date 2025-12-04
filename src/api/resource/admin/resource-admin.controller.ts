import { Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

import { AdminJwtAuthGuard } from '../../../common/guard/admin-jwt-auth.guard';

import { ResourceAdminService } from './resource-admin.service';

import { ResourceAdminCreateRequestDto } from './dto/request/resource-admin-create-request.dto';
import { ResourceAdminUpdateRequestDto } from './dto/request/resource-admin-update-request.dto';
import { ResourceAdminFilterRequestDto } from './dto/request/resource-admin-filter-request.dto';
import {
    ResourceAdminListResponseDto,
    ResourceAdminDetailResponseDto,
} from './dto/response/resource-admin-response.dto';

/**
 * 자료실 Admin API
 * 자료 관리 (CRUD)
 */
@ApiTags('자료실 관리자')
@Controller('resource-admin')
@UseGuards(AdminJwtAuthGuard)
@ApiBearerAuth()
export class ResourceAdminController {
    constructor(private readonly resourceAdminService: ResourceAdminService) {}

    /**
     * 자료 목록 조회
     */
    @Get()
    @ApiOperation({
        summary: '자료 목록 조회',
        description: `
자료 목록을 조회합니다.

필터링:
- keyword: 제목/설명 검색
- type: 자료 타입 (CATALOG, MANUAL, TECHNICAL, VIDEO, BROCHURE, CERTIFICATE, OTHER)
- category: 카테고리 slug
- isActive: 활성화 상태
- isFeatured: 추천 자료 여부

페이지네이션:
- page: 페이지 번호 (기본값: 1)
- limit: 페이지당 아이템 수 (기본값: 20)
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceAdminListResponseDto,
    })
    async findAll(@Query() filterDto: ResourceAdminFilterRequestDto) {
        const { resources, pagination } = await this.resourceAdminService.findAll(filterDto);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 목록 조회 성공',
            data: {
                items: resources,
                pagination,
            },
        };
    }

    /**
     * 자료 상세 조회
     */
    @Get(':id')
    @ApiOperation({
        summary: '자료 상세 조회',
        description: 'ID로 자료 상세 정보를 조회합니다.',
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '조회 성공',
        type: ResourceAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '자료를 찾을 수 없습니다',
    })
    async findById(@Param('id') id: string) {
        const resource = await this.resourceAdminService.findById(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 조회 성공',
            data: resource,
        };
    }

    /**
     * 자료 생성
     */
    @Post()
    @ApiOperation({
        summary: '자료 생성',
        description: `
새 자료를 생성합니다.

필수 필드:
- title: 자료 제목
- type: 자료 타입 (CATALOG, MANUAL, TECHNICAL, VIDEO, BROCHURE, CERTIFICATE, OTHER)
- file: 파일 정보 (url, fileName)

선택 필드:
- titleKo, description, descriptionKo
- categories, tags
- thumbnailUrl, previewUrl
- isFeatured, order
- publishedAt
- metadata (예: productName, model 등)
        `,
    })
    @SwaggerResponse({
        status: HttpStatus.CREATED,
        description: '생성 성공',
        type: ResourceAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.BAD_REQUEST,
        description: '입력 데이터 검증 실패',
    })
    async create(@Body() createDto: ResourceAdminCreateRequestDto) {
        const resource = await this.resourceAdminService.create(createDto);

        return {
            success: true,
            code: HttpStatus.CREATED,
            message: '자료 생성 성공',
            data: resource,
        };
    }

    /**
     * 자료 수정
     */
    @Patch(':id')
    @ApiOperation({
        summary: '자료 수정',
        description: '자료 정보를 수정합니다. 모든 필드가 선택적입니다.',
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '수정 성공',
        type: ResourceAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '자료를 찾을 수 없습니다',
    })
    async update(@Param('id') id: string, @Body() updateDto: ResourceAdminUpdateRequestDto) {
        const resource = await this.resourceAdminService.update(id, updateDto);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 수정 성공',
            data: resource,
        };
    }

    /**
     * 자료 삭제
     */
    @Delete(':id')
    @ApiOperation({
        summary: '자료 삭제',
        description: '자료를 삭제합니다.',
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '삭제 성공',
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '자료를 찾을 수 없습니다',
    })
    async delete(@Param('id') id: string) {
        await this.resourceAdminService.delete(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 삭제 성공',
            data: null,
        };
    }

    /**
     * 자료 활성화
     */
    @Patch(':id/activate')
    @ApiOperation({
        summary: '자료 활성화',
        description: '자료를 활성화합니다. isActive를 true로 설정합니다.',
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '활성화 성공',
        type: ResourceAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '자료를 찾을 수 없습니다',
    })
    async activate(@Param('id') id: string) {
        const resource = await this.resourceAdminService.activate(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 활성화 성공',
            data: resource,
        };
    }

    /**
     * 자료 비활성화
     */
    @Patch(':id/deactivate')
    @ApiOperation({
        summary: '자료 비활성화',
        description: '자료를 비활성화합니다. isActive를 false로 설정합니다.',
    })
    @ApiParam({
        name: 'id',
        description: '자료 ID',
        example: '507f1f77bcf86cd799439011',
    })
    @SwaggerResponse({
        status: HttpStatus.OK,
        description: '비활성화 성공',
        type: ResourceAdminDetailResponseDto,
    })
    @SwaggerResponse({
        status: HttpStatus.NOT_FOUND,
        description: '자료를 찾을 수 없습니다',
    })
    async deactivate(@Param('id') id: string) {
        const resource = await this.resourceAdminService.deactivate(id);

        return {
            success: true,
            code: HttpStatus.OK,
            message: '자료 비활성화 성공',
            data: resource,
        };
    }
}
