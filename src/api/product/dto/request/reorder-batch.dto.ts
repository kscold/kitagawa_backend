import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsString, Min, IsArray, ValidateNested } from 'class-validator';

/**
 * 제품 순서 항목 DTO
 */
export class ProductOrderItemDto {
    @ApiProperty({
        description: '제품 슬러그',
        example: 'nc-rotary-table-01',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({
        description: '새로운 순서',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    order: number;
}

/**
 * 제품 순서 일괄 변경 DTO
 * DND(Drag and Drop)로 여러 제품의 순서를 한번에 변경할 때 사용
 */
export class ReorderBatchDto {
    @ApiProperty({
        description: '카테고리 레벨 (1: 상위 카테고리, 2: 하위 카테고리)',
        enum: [1, 2],
        example: 1,
    })
    @IsNumber()
    @IsIn([1, 2])
    level: 1 | 2;

    @ApiProperty({
        description: '카테고리 슬러그',
        example: 'nc-rotary-table',
    })
    @IsString()
    @IsNotEmpty()
    categorySlug: string;

    @ApiProperty({
        description: '제품 순서 변경 항목들',
        type: [ProductOrderItemDto],
        example: [
            { slug: 'product-1', order: 0 },
            { slug: 'product-2', order: 1 },
            { slug: 'product-3', order: 2 },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductOrderItemDto)
    items: ProductOrderItemDto[];
}
