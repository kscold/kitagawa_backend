import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUrl } from 'class-validator';

/**
 * 대표 이미지 추가 요청 DTO
 */
export class AddMainImageRequestDto {
    @ApiProperty({ description: '이미지 URL', example: 'https://example.com/image.jpg' })
    @IsUrl()
    @IsNotEmpty()
    url: string;

    @ApiPropertyOptional({ description: '이미지 alt 텍스트 (영문)', example: 'Kitagawa main image' })
    @IsString()
    @IsOptional()
    alt?: string;

    @ApiPropertyOptional({ description: '이미지 alt 텍스트 (한글)', example: '키타가와 대표 이미지' })
    @IsString()
    @IsOptional()
    altKo?: string;
}
