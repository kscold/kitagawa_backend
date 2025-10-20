import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * 홈 소개 수정 요청 DTO
 */
export class UpdateHomeIntroductionRequestDto {
    @ApiPropertyOptional({ description: '제목 (영문)', example: 'Welcome to Kitagawa' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ description: '제목 (한글)', example: '키타가와에 오신 것을 환영합니다' })
    @IsString()
    @IsOptional()
    titleKo?: string;

    @ApiPropertyOptional({
        description: '설명 (영문)',
        example: 'Kitagawa is a global manufacturing company...',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        description: '설명 (한글)',
        example: '키타가와는 일본에 본사를 둔 글로벌 제조 기업으로...',
    })
    @IsString()
    @IsOptional()
    descriptionKo?: string;
}
