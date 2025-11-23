import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateProductDescriptionDto {
    @ApiPropertyOptional({
        description: '제품 설명 (짧은 소개)',
        example: 'High precision chuck for machining',
    })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional({
        description: '제품 상세 설명 (catch phrase)',
        example: 'Best choice for your precision machining needs',
    })
    @IsString()
    @IsOptional()
    contentDetail?: string;

    @ApiPropertyOptional({
        description: '제품 특징 리스트 (줄바꿈으로 구분)',
        example: 'High gripping force\nLong service life\nEasy to maintain',
    })
    @IsString()
    @IsOptional()
    description?: string;
}
