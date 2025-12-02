import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ContactRequestStatus } from '../../../../../schema/contact-request.schema';

/**
 * 문의 상태 업데이트 DTO
 */
export class UpdateContactStatusDto {
    @ApiProperty({ description: '처리 상태', enum: ContactRequestStatus, example: ContactRequestStatus.IN_PROGRESS })
    @IsEnum(ContactRequestStatus)
    @IsNotEmpty()
    status: ContactRequestStatus;

    @ApiPropertyOptional({ description: '관리자 메모', example: '고객에게 이메일 발송 완료' })
    @IsString()
    @IsOptional()
    adminNote?: string;
}
