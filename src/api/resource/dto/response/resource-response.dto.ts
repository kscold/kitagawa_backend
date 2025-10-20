import { ApiProperty } from '@nestjs/swagger';

import { StandardResponseDto, PaginatedResponseDto } from '../../../../common/dto/response/standard-response.dto';

/**
 * 자료 파일 정보 DTO
 */
export class ResourceFileDto {
    @ApiProperty({
        example: 'https://example.com/files/catalog.pdf',
        description: '파일 URL',
    })
    url: string;

    @ApiProperty({
        example: 'NC_Rotary_Table_Catalog_2025.pdf',
        description: '파일명',
    })
    fileName: string;

    @ApiProperty({
        example: 2048576,
        description: '파일 크기 (bytes)',
        required: false,
    })
    fileSize?: number;

    @ApiProperty({
        example: 'application/pdf',
        description: 'MIME 타입',
        required: false,
    })
    mimeType?: string;
}

/**
 * 자료 기본 정보 DTO (목록용)
 */
export class ResourceItemDto {
    @ApiProperty({
        example: '68ea5e4efb9a341dff2f609d',
        description: '자료 ID',
    })
    _id: string;

    @ApiProperty({
        example: 'NC Rotary Table Catalog 2025',
        description: '자료 제목 (영어)',
    })
    title: string;

    @ApiProperty({
        example: 'NC 로터리 테이블 카탈로그 2025',
        description: '자료 제목 (한글)',
        required: false,
    })
    titleKo?: string;

    @ApiProperty({
        example: 'CATALOG',
        description: '자료 타입',
        enum: ['CATALOG', 'MANUAL', 'TECHNICAL', 'VIDEO', 'BROCHURE', 'CERTIFICATE', 'OTHER'],
    })
    type: string;

    @ApiProperty({
        example: ['NC ROTARY TABLE', '4-Axis Standard'],
        description: '관련 카테고리 목록',
        isArray: true,
    })
    categories: string[];

    @ApiProperty({
        example: ['rotary', 'table', '4-axis'],
        description: '태그 목록',
        isArray: true,
        required: false,
    })
    tags?: string[];

    @ApiProperty({
        type: ResourceFileDto,
        description: '파일 정보',
    })
    file: ResourceFileDto;

    @ApiProperty({
        example: 'https://example.com/thumbnails/catalog-thumb.jpg',
        description: '썸네일 이미지 URL',
        required: false,
    })
    thumbnailUrl?: string;

    @ApiProperty({
        example: 1250,
        description: '조회수',
    })
    viewCount: number;

    @ApiProperty({
        example: 450,
        description: '다운로드 수',
    })
    downloadCount: number;

    @ApiProperty({
        example: true,
        description: '활성화 여부',
    })
    isActive: boolean;

    @ApiProperty({
        example: true,
        description: '추천 자료 여부',
    })
    isFeatured: boolean;

    @ApiProperty({
        example: '2025-01-15T00:00:00.000Z',
        description: '발행일',
        required: false,
    })
    publishedAt?: Date;

    @ApiProperty({
        example: '2025-01-15T10:30:00.000Z',
        description: '생성일',
    })
    createdAt: Date;
}

/**
 * 자료 상세 정보 DTO
 */
export class ResourceDetailDto extends ResourceItemDto {
    @ApiProperty({
        example: 'Comprehensive catalog for NC Rotary Table series',
        description: '자료 설명 (영어)',
        required: false,
    })
    description?: string;

    @ApiProperty({
        example: 'NC 로터리 테이블 시리즈 종합 카탈로그',
        description: '자료 설명 (한글)',
        required: false,
    })
    descriptionKo?: string;

    @ApiProperty({
        example: 'https://youtube.com/watch?v=example',
        description: '미리보기 URL (영상의 경우)',
        required: false,
    })
    previewUrl?: string;

    @ApiProperty({
        example: 0,
        description: '정렬 순서',
    })
    order: number;

    @ApiProperty({
        example: { version: '2.0', language: 'en' },
        description: '추가 메타데이터',
        required: false,
    })
    metadata?: Record<string, any>;

    @ApiProperty({
        example: '2025-01-15T10:30:00.000Z',
        description: '수정일',
    })
    updatedAt: Date;
}

/**
 * 자료 타입별 통계 DTO
 */
export class ResourceTypeStatDto {
    @ApiProperty({
        example: 'CATALOG',
        description: '자료 타입',
        enum: ['CATALOG', 'MANUAL', 'TECHNICAL', 'VIDEO', 'BROCHURE', 'CERTIFICATE', 'OTHER'],
    })
    type: string;

    @ApiProperty({
        example: 25,
        description: '해당 타입의 자료 수',
    })
    count: number;
}

/**
 * 자료 목록 응답
 */
export class ResourceListResponseDto extends PaginatedResponseDto<ResourceItemDto> {
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
        example: '자료 목록 조회 성공',
        description: '응답 메시지',
    })
    message: string;
}

/**
 * 자료 상세 응답
 */
export class ResourceDetailResponseDto extends StandardResponseDto<ResourceDetailDto> {
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
        example: '자료 조회 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: ResourceDetailDto,
        description: '자료 상세 정보',
    })
    data: ResourceDetailDto;
}

/**
 * 자료 타입별 통계 응답
 */
export class ResourceTypeStatsResponseDto extends StandardResponseDto<ResourceTypeStatDto[]> {
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
        example: '자료 타입별 통계 조회 성공',
        description: '응답 메시지',
    })
    message: string;

    @ApiProperty({
        type: [ResourceTypeStatDto],
        description: '타입별 통계 데이터',
        isArray: true,
    })
    data: ResourceTypeStatDto[];
}

/**
 * 다운로드 수 증가 응답
 */
export class ResourceDownloadResponseDto extends StandardResponseDto<void> {
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
        example: '다운로드 수 증가 성공',
        description: '응답 메시지',
    })
    message: string;
}
