import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ProductOrderItem {
    @ApiProperty({
        description: '제품 slug',
        example: 'br-series',
    })
    @IsString()
    slug: string;

    @ApiProperty({
        description: '정렬 순서 (0부터 시작)',
        example: 0,
    })
    @IsNumber()
    order: number;
}

export class CategoryAdminProductReorderRequestDto {
    @ApiProperty({
        description: '제품 목록 (순서대로)',
        type: [ProductOrderItem],
        example: [
            { slug: 'br-series', order: 0 },
            { slug: 'b-200-series', order: 1 },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProductOrderItem)
    items: ProductOrderItem[];
}
