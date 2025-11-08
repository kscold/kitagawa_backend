import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

/**
 * 제품 순서 업데이트 DTO
 * 특정 카테고리 레벨 내에서 제품 순서를 변경할 때 사용
 */
export class UpdateProductOrderDto {
    @ApiProperty({
        description: '제품 슬러그',
        example: 'nc-rotary-table-01',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;

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
        description: '새로운 순서 (낮을수록 먼저 노출)',
        example: 1,
    })
    @IsNumber()
    @Min(0)
    order: number;
}
