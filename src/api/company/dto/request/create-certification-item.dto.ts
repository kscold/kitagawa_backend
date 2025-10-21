import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 인증서 추가 DTO
 */
export class CreateCertificationItemDto {
    @ApiProperty({
        description: '인증명 (영어)',
        example: 'ISO 9001:2015',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        description: '인증명 (한글)',
        example: 'ISO 9001:2015 품질경영시스템 인증',
    })
    @IsString()
    @IsNotEmpty()
    nameKo: string;

    @ApiPropertyOptional({
        description: '발급 기관 (영어)',
        example: 'Korea Quality Assurance',
    })
    @IsString()
    @IsOptional()
    issuer?: string;

    @ApiPropertyOptional({
        description: '발급 기관 (한글)',
        example: '한국품질보증',
    })
    @IsString()
    @IsOptional()
    issuerKo?: string;

    @ApiPropertyOptional({
        description: '발급일 (YYYY-MM-DD)',
        example: '2024-01-15',
    })
    @IsString()
    @IsOptional()
    issuedDate?: string;

    @ApiPropertyOptional({
        description: '인증서 이미지 URL',
        example: 'https://example.com/certificate.pdf',
    })
    @IsString()
    @IsOptional()
    certificateUrl?: string;
}
