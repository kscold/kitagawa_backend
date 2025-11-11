import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    Min,
    IsUrl,
    IsEnum,
    IsArray,
    IsString,
    IsNumber,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    ValidateNested,
} from 'class-validator';

import { CategoryLevel } from '../../../../schemas/category.schema';

/**
 * 다운로드 링크 DTO
 */
export class CategoryDownloadLinkDto {
    @ApiPropertyOptional({ description: '파일 타입', example: 'PDF' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ description: '카테고리', example: 'Catalog' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ description: '파일 제목', example: 'NC ROTARY TABLE Catalogue' })
    @IsString()
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ description: '다운로드 URL', example: 'https://example.com/file.pdf' })
    @IsUrl()
    @IsOptional()
    url?: string;

    @ApiPropertyOptional({ description: '해당 모델명', example: 'MK200' })
    @IsString()
    @IsOptional()
    model?: string;
}

/**
 * 카테고리 생성 요청 DTO
 */
export class CreateCategoryRequestDto {
    @ApiProperty({ description: '카테고리명', example: 'NC ROTARY TABLE' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'URL용 슬러그 (고유값)', example: 'nc-rotary-table' })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiPropertyOptional({ description: '카테고리 설명' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: '카테고리 상세 설명' })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiPropertyOptional({ description: '카테고리 소개 HTML (사양서, 설명 등)' })
    @IsString()
    @IsOptional()
    specificationHtml?: string;

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

    @ApiPropertyOptional({ description: '카테고리 대표 이미지 URL' })
    @IsUrl()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'YouTube 영상 URL 배열', type: [String] })
    @IsArray()
    @IsUrl({}, { each: true })
    @IsOptional()
    youtubeUrl?: string[];

    @ApiPropertyOptional({ description: '다운로드 링크 배열', type: [CategoryDownloadLinkDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryDownloadLinkDto)
    @IsOptional()
    downloads?: CategoryDownloadLinkDto[];

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
