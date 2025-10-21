import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsBoolean, IsUrl, Min } from 'class-validator';

import { CategoryLevel } from '../../../../schemas/category.schema';

/**
 * 카테고리 생성 요청 DTO
 */
export class CreateCategoryRequestDto {
    @ApiProperty({ description: '카테고리명 (영문)', example: 'NC ROTARY TABLE' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: '한국어 카테고리명', example: 'NC 로터리 테이블' })
    @IsString()
    @IsNotEmpty()
    nameKo: string;

    @ApiProperty({ description: 'URL용 슬러그 (고유값)', example: 'nc-rotary-table' })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiPropertyOptional({ description: '카테고리 설명 (영문)' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: '카테고리 설명 (한국어)' })
    @IsString()
    @IsOptional()
    descriptionKo?: string;

    @ApiProperty({
        description: '카테고리 레벨',
        enum: CategoryLevel,
        example: CategoryLevel.LEVEL_1,
    })
    @IsEnum(CategoryLevel)
    level: CategoryLevel;

    @ApiPropertyOptional({
        description: '부모 카테고리명 (Level 2인 경우 필수)',
        example: 'NC ROTARY TABLE',
    })
    @IsString()
    @IsOptional()
    parentName?: string;

    @ApiPropertyOptional({
        description: '대분류명 (Level 2인 경우 자동 설정)',
        example: 'NC ROTARY TABLE',
    })
    @IsString()
    @IsOptional()
    mainCategory?: string;

    @ApiPropertyOptional({ description: '카테고리 아이콘 URL' })
    @IsUrl()
    @IsOptional()
    iconUrl?: string;

    @ApiPropertyOptional({ description: '카테고리 대표 이미지 URL' })
    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: '정렬 순서', example: 0, default: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    order?: number;

    @ApiPropertyOptional({ description: '활성화 상태', example: true, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
