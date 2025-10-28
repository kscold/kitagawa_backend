import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactRequestStatus } from '../../../../../schemas/contact-request.schema';

/**
 * 문의 상세 응답 DTO
 */
export class ContactAdminDetailResponseDto {
    @ApiProperty({ description: '문의 ID' })
    _id: string;

    @ApiProperty({ description: '담당자명' })
    managerName: string;

    @ApiProperty({ description: '업체명' })
    companyName: string;

    @ApiProperty({ description: '이메일' })
    email: string;

    @ApiProperty({ description: '전화번호' })
    phone: string;

    @ApiProperty({ description: '문의사항' })
    message: string;

    @ApiPropertyOptional({ description: '첨부파일 URL' })
    attachmentUrl?: string;

    @ApiProperty({ description: '개인정보 수집 동의' })
    privacyConsent: boolean;

    @ApiProperty({ description: '처리 상태', enum: ContactRequestStatus })
    status: ContactRequestStatus;

    @ApiPropertyOptional({ description: '관리자 메모' })
    adminNote?: string;

    @ApiPropertyOptional({ description: '처리 완료 시간' })
    processedAt?: Date;

    @ApiPropertyOptional({ description: '처리한 관리자 ID' })
    processedBy?: string;

    @ApiProperty({ description: '문의 접수 시간' })
    createdAt: Date;

    @ApiProperty({ description: '마지막 업데이트 시간' })
    updatedAt: Date;
}

/**
 * 문의 목록 응답 DTO
 */
export class ContactAdminListResponseDto {
    @ApiProperty({ description: '문의 목록', type: [ContactAdminDetailResponseDto] })
    items: ContactAdminDetailResponseDto[];

    @ApiProperty({ description: '페이지네이션 정보' })
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
