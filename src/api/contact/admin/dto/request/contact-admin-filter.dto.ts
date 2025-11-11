import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

import { ContactRequestStatus } from '../../../../../schemas/contact-request.schema';

/**
 * 문의 관리 필터 DTO
 */
export class ContactAdminFilterDto {
    @ApiPropertyOptional({ description: '검색 키워드 (담당자명, 업체명, 이메일, 메시지)', example: '홍길동' })
    @IsString()
    @IsOptional()
    keyword?: string;

    @ApiPropertyOptional({
        description: '처리 상태',
        enum: ContactRequestStatus,
        example: ContactRequestStatus.PENDING,
    })
    @IsEnum(ContactRequestStatus)
    @IsOptional()
    status?: ContactRequestStatus;

    @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: '페이지당 아이템 수', example: 20, default: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
