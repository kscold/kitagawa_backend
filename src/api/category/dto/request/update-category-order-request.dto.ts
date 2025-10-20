import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

/**
 * 카테고리 순서 변경 요청 DTO
 */
export class UpdateCategoryOrderRequestDto {
    @ApiProperty({ description: '새로운 정렬 순서', example: 1 })
    @IsNumber()
    @Min(0)
    order: number;
}
