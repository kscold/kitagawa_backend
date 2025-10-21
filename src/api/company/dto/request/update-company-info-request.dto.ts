import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * 회사 기본 정보 수정 DTO
 */
export class UpdateCompanyInfoRequestDto {
    @ApiPropertyOptional({
        description: '비전 (영어)',
        example: 'To be the leading provider of precision machining solutions in Korea',
    })
    @IsString()
    @IsOptional()
    vision?: string;

    @ApiPropertyOptional({
        description: '비전 (한글)',
        example: '대한민국 최고의 정밀 가공 솔루션 제공 기업',
    })
    @IsString()
    @IsOptional()
    visionKo?: string;

    @ApiPropertyOptional({
        description: '미션 (영어)',
        example: 'Provide high-quality products and exceptional customer service',
    })
    @IsString()
    @IsOptional()
    mission?: string;

    @ApiPropertyOptional({
        description: '미션 (한글)',
        example: '고품질 제품과 탁월한 고객 서비스 제공',
    })
    @IsString()
    @IsOptional()
    missionKo?: string;
}
