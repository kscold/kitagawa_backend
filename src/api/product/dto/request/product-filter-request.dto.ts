import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * 제품 필터 DTO
 * 페이지네이션은 PaginationQueryDto를 사용
 */
export class ProductFilterRequestDto {
    @ApiProperty({
        example: 'CHUCK',
        description: '메인 카테고리',
        required: false,
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({
        example: '유압 중공척',
        description: '서브 카테고리',
        required: false,
    })
    @IsOptional()
    @IsString()
    subCategory?: string;

    @ApiProperty({
        example: 'Chucks',
        description: '태그',
        required: false,
    })
    @IsOptional()
    @IsString()
    tag?: string;

    @ApiProperty({
        example: true,
        description: '활성화 상태',
        required: false,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    isActive?: boolean;
}
