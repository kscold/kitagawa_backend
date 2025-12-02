import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNotEmpty,
    IsEnum,
    IsArray,
    IsOptional,
    IsNumber,
    IsBoolean,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

import { ResourceType } from '../../../../../schema/resource.schema';

/**
 * 자료 파일 정보 DTO
 */
export class ResourceFileDto {
    @ApiProperty({ description: '파일 URL', example: 'https://storage.example.com/catalog.pdf' })
    @IsString()
    @IsNotEmpty()
    url: string;

    @ApiProperty({ description: '파일명', example: 'catalog.pdf' })
    @IsString()
    @IsNotEmpty()
    fileName: string;

    @ApiPropertyOptional({ description: '파일 크기 (bytes)', example: 1024000 })
    @IsNumber()
    @IsOptional()
    fileSize?: number;

    @ApiPropertyOptional({ description: 'MIME 타입', example: 'application/pdf' })
    @IsString()
    @IsOptional()
    mimeType?: string;
}

/**
 * 자료 생성 요청 DTO
 */
export class CreateResourceRequestDto {
    @ApiProperty({ description: '자료 제목', example: 'GT Series Catalog' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({ description: '설명', example: 'Complete catalog for GT series' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({ description: '자료 타입', enum: ResourceType, example: ResourceType.CATALOG })
    @IsEnum(ResourceType)
    @IsNotEmpty()
    type: ResourceType;

    @ApiPropertyOptional({ description: '관련 카테고리', type: [String], example: ['nc-rotary-table', 'chuck'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    categories?: string[];

    @ApiPropertyOptional({ description: '태그', type: [String], example: ['catalog', 'pdf'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiProperty({ description: '파일 정보', type: ResourceFileDto })
    @ValidateNested()
    @Type(() => ResourceFileDto)
    @IsNotEmpty()
    file: ResourceFileDto;

    @ApiPropertyOptional({ description: '썸네일 URL', example: 'https://storage.example.com/thumbnail.jpg' })
    @IsString()
    @IsOptional()
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: '미리보기 URL', example: 'https://www.youtube.com/watch?v=xxxxx' })
    @IsString()
    @IsOptional()
    previewUrl?: string;

    @ApiPropertyOptional({ description: '추천 자료 여부', example: false })
    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @ApiPropertyOptional({ description: '정렬 순서', example: 0 })
    @IsNumber()
    @IsOptional()
    order?: number;

    @ApiPropertyOptional({ description: '발행일', example: '2025-01-15T00:00:00.000Z' })
    @IsOptional()
    publishedAt?: Date;

    @ApiPropertyOptional({ description: '추가 메타데이터', example: { productName: 'GT Series', model: 'GT200' } })
    @IsOptional()
    metadata?: Record<string, any>;
}
