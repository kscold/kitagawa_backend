import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

import { PaginationQueryDto } from '../../../../common/dto/pagination/pagination-query.dto';

import { ResourceType } from '../../../../schemas/resource.schema';

/**
 * 자료실 필터 DTO
 */
export class ResourceFilterDto extends PaginationQueryDto {
    @ApiProperty({
        description: '자료 타입',
        enum: ResourceType,
        example: ResourceType.CATALOG,
        required: false,
    })
    @IsOptional()
    @IsEnum(ResourceType)
    type?: ResourceType;

    @ApiProperty({
        description: '카테고리',
        example: 'CHUCK',
        required: false,
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({
        description: '검색 키워드',
        example: 'catalog',
        required: false,
    })
    @IsOptional()
    @IsString()
    keyword?: string;
}
