import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

import { PaginationQueryDto } from '../../../../common/dto/pagination/pagination-query.dto';

/**
 * 제품 검색 쿼리 DTO
 *
 * - 영어, 한글, 자음 검색 지원
 * - 제품명, 제품코드, 시리즈, 카테고리 전체 검색
 * - 페이지네이션 지원
 */
export class SearchProductQueryDto extends PaginationQueryDto {
    @ApiProperty({
        description: '검색 키워드 (영어, 한글, 자음 모두 지원)',
        example: 'chuck',
        required: true,
        minLength: 1,
    })
    @IsString()
    @MinLength(1, { message: '검색 키워드는 최소 1자 이상이어야 합니다' })
    keyword: string;

    @ApiProperty({
        description: '카테고리 필터 (선택)',
        example: 'CHUCK',
        required: false,
    })
    @IsOptional()
    @IsString()
    category?: string;

    @ApiProperty({
        description: '서브카테고리 필터 (선택)',
        example: 'Hydraulic hollow chuck',
        required: false,
    })
    @IsOptional()
    @IsString()
    subCategory?: string;
}
