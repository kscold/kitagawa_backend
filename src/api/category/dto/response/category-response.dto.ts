import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

import { StandardResponseDto } from '../../../../common/dto/response/standard-response.dto';
import { SeriesInfoResponseDto } from './series-info-response.dto';
import { Level1CategoryResponseDto } from './level1-category-response.dto';

/**
 * 하위 카테고리 DTO (Level 2)
 */
export class SubCategoryDto {
    @ApiProperty({
        example: '68f3d059b9aaa2b9a0fb3560',
        description: '카테고리 ID',
    })
    _id: string;

    @ApiProperty({
        example: '4-Axis Standard',
        description: '서브 카테고리명 (영문)',
    })
    name: string;

    @ApiProperty({
        example: '4축 표준형',
        description: '서브 카테고리명 (한글)',
    })
    nameKo: string;

    @ApiProperty({
        example: 'nc-rotary-table-4-axis-standard',
        description: 'URL 슬러그',
    })
    slug: string;

    @ApiProperty({
        example: 2,
        description: '카테고리 레벨',
    })
    level: number;

    @ApiProperty({
        example: 5,
        description: '제품 수',
    })
    productCount: number;

    @ApiProperty({
        example: true,
        description: '활성화 여부',
    })
    isActive: boolean;

    @ApiProperty({
        type: [SeriesInfoResponseDto],
        description: '시리즈 정보 목록 (제품이 여러 개인 경우)',
        required: false,
    })
    series?: SeriesInfoResponseDto[];
}

/**
 * 카테고리 계층 구조 DTO
 */
export class CategoryTreeDto {
    @ApiProperty({
        example: '68f3d059b9aaa2b9a0fb3559',
        description: '대분류 카테고리 ID',
    })
    _id: string;

    @ApiProperty({
        example: 'NC ROTARY TABLE',
        description: '대분류 카테고리명 (영문)',
    })
    name: string;

    @ApiProperty({
        example: 'NC 로터리 테이블',
        description: '대분류 카테고리명 (한글)',
    })
    nameKo: string;

    @ApiProperty({
        example: 'nc-rotary-table',
        description: 'URL 슬러그',
    })
    slug: string;

    @ApiProperty({
        example: 1,
        description: '카테고리 레벨',
    })
    level: number;

    @ApiProperty({
        example: 'https://www.kitagawa.com/en/mtools/item/data/IMG/catalog.png',
        description: '카테고리 이미지 URL',
        required: false,
    })
    imageUrl?: string;

    @ApiProperty({
        example: true,
        description: '활성화 여부',
    })
    isActive: boolean;

    @ApiProperty({
        type: [SubCategoryDto],
        description: '하위 카테고리 목록',
        isArray: true,
    })
    subCategories: SubCategoryDto[];
}

/**
 * 카테고리 검색 결과 항목 DTO
 */
export class CategorySearchItemDto {
    @ApiProperty({
        example: '68f3d059b9aaa2b9a0fb3559',
        description: '카테고리 ID',
    })
    _id: string;

    @ApiProperty({
        example: 'Hydraulic Hollow Chuck',
        description: '카테고리명 (영문)',
    })
    name: string;

    @ApiProperty({
        example: '유압 중공 척',
        description: '카테고리명 (한글)',
    })
    nameKo: string;

    @ApiProperty({
        example: 'chuck-hydraulic-hollow-chuck',
        description: 'URL 슬러그',
    })
    slug: string;

    @ApiProperty({
        example: 2,
        description: '카테고리 레벨 (1: 대분류, 2: 중분류)',
    })
    level: number;

    @ApiProperty({
        example: 'Chuck',
        description: '상위 카테고리명',
        required: false,
    })
    parentName?: string;

    @ApiProperty({
        example: 8,
        description: '제품 수',
    })
    productCount: number;
}

/**
 * Level 1 카테고리 목록 응답
 */
export class CategoryLevel1ListResponseDto extends StandardResponseDto<Level1CategoryResponseDto[]> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: HttpStatus.OK,
        description: 'HTTP 상태 코드',
    })
    code: number;

    @ApiProperty({
        example: '대분류 카테고리 조회 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: [Level1CategoryResponseDto],
        description: '대분류 카테고리 목록',
        isArray: true,
    })
    data: Level1CategoryResponseDto[];
}

/**
 * 카테고리 계층 구조 응답
 */
export class CategoryTreeResponseDto extends StandardResponseDto<CategoryTreeDto> {
    @ApiProperty({
        example: true,
        description: '요청 성공 여부',
    })
    success: boolean;

    @ApiProperty({
        example: 200,
        description: 'HTTP 상태 코드',
    })
    code: number;

    @ApiProperty({
        example: '카테고리 계층 구조 조회 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: CategoryTreeDto,
        description: '카테고리 계층 구조',
    })
    data: CategoryTreeDto;
}
