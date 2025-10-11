import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * 페이지네이션 쿼리 DTO
 */
export class PaginationQueryDto {
    @ApiProperty({
        example: 1,
        description: '페이지 번호 (1부터 시작)',
        required: false,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: '페이지 번호는 정수여야 합니다' })
    @Min(1, { message: '페이지 번호는 1 이상이어야 합니다' })
    page?: number = 1;

    @ApiProperty({
        example: 20,
        description: '페이지당 아이템 개수 (최대 100)',
        required: false,
        default: 20,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: '페이지 크기는 정수여야 합니다' })
    @Min(1, { message: '페이지 크기는 1 이상이어야 합니다' })
    @Max(100, { message: '페이지 크기는 100 이하여야 합니다' })
    limit?: number = 20;

    get offset(): number {
        return (this.page - 1) * this.limit;
    }
}
