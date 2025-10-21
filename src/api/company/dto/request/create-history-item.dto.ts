import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * 회사 연혁 추가 DTO
 */
export class CreateHistoryItemDto {
    @ApiProperty({
        description: '연도',
        example: '2024',
    })
    @IsString()
    @IsNotEmpty()
    year: string;

    @ApiPropertyOptional({
        description: '월',
        example: '01',
    })
    @IsString()
    @IsOptional()
    month?: string;

    @ApiProperty({
        description: '설명 (영어)',
        example: 'Launched new product line',
    })
    @IsString()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        description: '설명 (한글)',
        example: '신제품 라인 출시',
    })
    @IsString()
    @IsNotEmpty()
    descriptionKo: string;
}
