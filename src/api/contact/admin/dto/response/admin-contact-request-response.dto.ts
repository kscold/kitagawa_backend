import { ApiProperty } from '@nestjs/swagger';
import {
    AdminContactRequestStatus,
    AdminContactRequestType,
    ImportStatus,
} from '../../../../../schema/admin-contact-request.schema';

/**
 * Admin Contact Request 상세 응답 DTO
 */
export class AdminContactRequestDetailDto {
    @ApiProperty({ description: 'ID', example: '507f1f77bcf86cd799439011' })
    _id: string;

    @ApiProperty({
        description: '요청 유형',
        enum: AdminContactRequestType,
        example: AdminContactRequestType.NEW_PRODUCT,
    })
    type: AdminContactRequestType;

    @ApiProperty({ description: '제품명', example: 'BB series', required: false })
    productName?: string;

    @ApiProperty({ description: '시리즈명', example: 'Power Chuck', required: false })
    seriesName?: string;

    @ApiProperty({
        description: 'URL',
        example: 'https://www.kitagawa.co.jp/products/bb-series',
        required: false,
    })
    url?: string;

    @ApiProperty({
        description: '요청 사항',
        example: '기존 제품의 스펙 업데이트가 필요합니다',
        required: false,
    })
    requestDetails?: string;

    @ApiProperty({
        description: '처리 상태',
        enum: AdminContactRequestStatus,
        example: AdminContactRequestStatus.PENDING,
    })
    status: AdminContactRequestStatus;

    @ApiProperty({ description: '요청한 관리자 ID', example: 'admin123' })
    requestedBy: string;

    @ApiProperty({ description: '관리자 메모', example: '검토 중입니다', required: false })
    adminNote?: string;

    @ApiProperty({ description: '처리 완료 시간', example: '2024-01-15T10:00:00Z', required: false })
    processedAt?: Date;

    @ApiProperty({ description: '처리한 관리자 ID', example: 'admin456', required: false })
    processedBy?: string;

    @ApiProperty({ description: '생성 시간', example: '2024-01-15T09:00:00Z' })
    createdAt: Date;

    @ApiProperty({ description: '수정 시간', example: '2024-01-15T09:00:00Z' })
    updatedAt: Date;

    @ApiProperty({ description: '자동 Import 여부', example: false })
    autoImport: boolean;

    @ApiProperty({ description: 'Import 상태', enum: ImportStatus, example: ImportStatus.NONE })
    importStatus: ImportStatus;

    @ApiProperty({ description: 'Import 에러 메시지', required: false })
    importError?: string;

    @ApiProperty({ description: 'Import된 Resource ID 목록', type: [String], example: [] })
    importedResourceIds: string[];
}

/**
 * Admin Contact Request 목록 응답 DTO
 */
export class AdminContactRequestListDto {
    @ApiProperty({ description: 'ID', example: '507f1f77bcf86cd799439011' })
    _id: string;

    @ApiProperty({
        description: '요청 유형',
        enum: AdminContactRequestType,
        example: AdminContactRequestType.NEW_PRODUCT,
    })
    type: AdminContactRequestType;

    @ApiProperty({ description: '제품명', example: 'BB series', required: false })
    productName?: string;

    @ApiProperty({ description: '시리즈명', example: 'Power Chuck', required: false })
    seriesName?: string;

    @ApiProperty({
        description: '요청 사항 (요약)',
        example: '기존 제품의 스펙 업데이트...',
        required: false,
    })
    requestDetailsSummary?: string;

    @ApiProperty({
        description: '처리 상태',
        enum: AdminContactRequestStatus,
        example: AdminContactRequestStatus.PENDING,
    })
    status: AdminContactRequestStatus;

    @ApiProperty({ description: '요청한 관리자 ID', example: 'admin123' })
    requestedBy: string;

    @ApiProperty({ description: '생성 시간', example: '2024-01-15T09:00:00Z' })
    createdAt: Date;

    @ApiProperty({ description: 'Import 상태', enum: ImportStatus, example: ImportStatus.NONE })
    importStatus: ImportStatus;
}

/**
 * Pagination 정보
 */
export class PaginationDto {
    @ApiProperty({ description: '현재 페이지', example: 1 })
    currentPage: number;

    @ApiProperty({ description: '전체 페이지 수', example: 5 })
    totalPages: number;

    @ApiProperty({ description: '전체 아이템 수', example: 47 })
    totalItems: number;

    @ApiProperty({ description: '페이지당 아이템 수', example: 10 })
    itemsPerPage: number;

    @ApiProperty({ description: '다음 페이지 존재 여부', example: true })
    hasNextPage: boolean;

    @ApiProperty({ description: '이전 페이지 존재 여부', example: false })
    hasPreviousPage: boolean;
}

/**
 * Admin Contact Request 목록 응답
 */
export class AdminContactRequestListResponseDto {
    @ApiProperty({ description: '성공 여부', example: true })
    success: boolean;

    @ApiProperty({ description: '상태 코드', example: 200 })
    code: number;

    @ApiProperty({ description: '메시지', example: 'Admin 요청 목록 조회 성공' })
    message: string;

    @ApiProperty({ description: '데이터' })
    data: {
        items: AdminContactRequestListDto[];
        pagination: PaginationDto;
    };
}

/**
 * Admin Contact Request 상세 응답
 */
export class AdminContactRequestDetailResponseDto {
    @ApiProperty({ description: '성공 여부', example: true })
    success: boolean;

    @ApiProperty({ description: '상태 코드', example: 200 })
    code: number;

    @ApiProperty({ description: '메시지', example: 'Admin 요청 조회 성공' })
    message: string;

    @ApiProperty({ description: '데이터', type: AdminContactRequestDetailDto })
    data: AdminContactRequestDetailDto;
}
