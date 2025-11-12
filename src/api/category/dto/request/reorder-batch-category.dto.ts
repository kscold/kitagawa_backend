import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsString, Min, IsArray, ValidateNested } from 'class-validator';

/**
 * 카테고리 순서 항목 DTO
 */
export class CategoryOrderItemDto {
    @ApiProperty({
        description: '카테고리 슬러그',
        example: 'nc-rotary-table',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({
        description: '새로운 순서',
        example: 0,
    })
    @IsNumber()
    @Min(0)
    order: number;
}

/**
 * 카테고리 순서 일괄 변경 DTO
 * DND(Drag and Drop)로 여러 카테고리의 순서를 한번에 변경할 때 사용
 */
export class ReorderBatchCategoryDto {
    @ApiProperty({
        description: '카테고리 레벨 (1: 대분류, 2: 중분류)',
        enum: [1, 2],
        example: 1,
    })
    @IsNumber()
    @IsIn([1, 2])
    level: 1 | 2;

    @ApiProperty({
        description: '부모 카테고리명 (Level 2인 경우 필수)',
        example: 'NC ROTARY TABLE',
        required: false,
    })
    @IsString()
    @IsNotEmpty()
    parentName?: string;

    @ApiProperty({
        description: '카테고리 순서 변경 항목들',
        type: [CategoryOrderItemDto],
        example: [
            { slug: 'nc-rotary-table', order: 0 },
            { slug: 'vise', order: 1 },
            { slug: 'chuck', order: 2 },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryOrderItemDto)
    items: CategoryOrderItemDto[];
}
