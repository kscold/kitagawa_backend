import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

import { ResourceType } from '../../../../../schema/resource.schema';

/**
 * 자료 관리 필터 DTO
 */
export class ResourceAdminFilterRequestDto {
    @ApiPropertyOptional({ description: '검색 키워드 (제목, 설명)', example: 'catalog' })
    @IsString()
    @IsOptional()
    keyword?: string;

    @ApiPropertyOptional({ description: '자료 타입', enum: ResourceType })
    @IsEnum(ResourceType)
    @IsOptional()
    type?: ResourceType;

    @ApiPropertyOptional({ description: '카테고리', example: 'nc-rotary-table' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ description: '활성화 상태', example: true })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: '추천 자료 여부', example: false })
    @IsBoolean()
    @Type(() => Boolean)
    @IsOptional()
    isFeatured?: boolean;

    @ApiPropertyOptional({ description: '페이지 번호', example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    page?: number;

    @ApiPropertyOptional({ description: '페이지당 아이템 수', example: 20, default: 20 })
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}
