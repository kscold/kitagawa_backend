import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResourceType } from '../../../../../schemas/resource.schema';

/**
 * 자료 파일 정보 응답 DTO
 */
export class ResourceFileResponseDto {
    @ApiProperty({ description: '파일 URL' })
    url: string;

    @ApiProperty({ description: '파일명' })
    fileName: string;

    @ApiPropertyOptional({ description: '파일 크기 (bytes)' })
    fileSize?: number;

    @ApiPropertyOptional({ description: 'MIME 타입' })
    mimeType?: string;
}

/**
 * 자료 상세 응답 DTO
 */
export class ResourceAdminDetailResponseDto {
    @ApiProperty({ description: '자료 ID' })
    _id: string;

    @ApiProperty({ description: '자료 제목' })
    title: string;

    @ApiPropertyOptional({ description: '한글 제목' })
    titleKo?: string;

    @ApiPropertyOptional({ description: '설명' })
    description?: string;

    @ApiPropertyOptional({ description: '한글 설명' })
    descriptionKo?: string;

    @ApiProperty({ description: '자료 타입', enum: ResourceType })
    type: ResourceType;

    @ApiProperty({ description: '관련 카테고리', type: [String] })
    categories: string[];

    @ApiProperty({ description: '태그', type: [String] })
    tags: string[];

    @ApiProperty({ description: '파일 정보', type: ResourceFileResponseDto })
    file: ResourceFileResponseDto;

    @ApiPropertyOptional({ description: '썸네일 URL' })
    thumbnailUrl?: string;

    @ApiPropertyOptional({ description: '미리보기 URL' })
    previewUrl?: string;

    @ApiProperty({ description: '조회수' })
    viewCount: number;

    @ApiProperty({ description: '다운로드수' })
    downloadCount: number;

    @ApiProperty({ description: '활성화 여부' })
    isActive: boolean;

    @ApiProperty({ description: '추천 자료 여부' })
    isFeatured: boolean;

    @ApiProperty({ description: '정렬 순서' })
    order: number;

    @ApiPropertyOptional({ description: '발행일' })
    publishedAt?: Date;

    @ApiPropertyOptional({ description: '추가 메타데이터' })
    metadata?: Record<string, any>;

    @ApiProperty({ description: '생성일' })
    createdAt: Date;

    @ApiProperty({ description: '수정일' })
    updatedAt: Date;
}

/**
 * 자료 목록 응답 DTO
 */
export class ResourceAdminListResponseDto {
    @ApiProperty({ description: '자료 목록', type: [ResourceAdminDetailResponseDto] })
    items: ResourceAdminDetailResponseDto[];

    @ApiProperty({ description: '페이지네이션 정보' })
    pagination: {
        currentPage: number;
        totalPages: number;
        totalItems: number;
        itemsPerPage: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}
