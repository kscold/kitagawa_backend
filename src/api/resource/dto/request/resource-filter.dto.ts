import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

import { PaginationQueryDto } from '../../../../common/dto/pagination/pagination-query.dto';

import { ResourceType } from '../../../../schemas/resource.schema';

/**
 * 파일 타입 Enum
 */
export enum FileType {
    PDF = 'pdf',
    DWG = 'dwg',
    DOC = 'doc',
    DOCX = 'docx',
    XLS = 'xls',
    XLSX = 'xlsx',
    ZIP = 'zip',
}

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

    @ApiProperty({
        description: '파일 타입 (확장자)',
        enum: FileType,
        example: FileType.PDF,
        required: false,
    })
    @IsOptional()
    @IsEnum(FileType)
    fileType?: FileType;
}
