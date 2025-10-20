import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsString,
    IsOptional,
    IsArray,
    IsBoolean,
    IsNumber,
    IsObject,
    ValidateNested,
    IsNotEmpty,
    IsUrl,
    Min,
} from 'class-validator';

/**
 * 카테고리 DTO
 */
export class CategoryDto {
    @ApiProperty({ description: '메인 카테고리', example: 'Chucks' })
    @IsString()
    @IsNotEmpty()
    mainCategory: string;

    @ApiProperty({ description: '서브 카테고리', example: 'Standard Chucks with Wedge' })
    @IsString()
    @IsNotEmpty()
    subCategory: string;

    @ApiPropertyOptional({ description: '시리즈', example: 'BR/BR-PLUS Series' })
    @IsString()
    @IsOptional()
    series?: string;
}

/**
 * 모델별 사양 DTO
 */
export class ModelSpecificationDto {
    @ApiProperty({ description: '모델명', example: 'BR05' })
    @IsString()
    @IsNotEmpty()
    model: string;

    @ApiProperty({ description: '사양 정보 (동적 객체)', example: { diameter: '100mm', weight: '5kg' } })
    @IsObject()
    specifications: Record<string, any>;
}

/**
 * 다운로드 링크 DTO
 */
export class DownloadLinkDto {
    @ApiPropertyOptional({ description: '파일 타입', example: 'PDF' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ description: '카테고리', example: '2D' })
    @IsString()
    @IsOptional()
    category?: string;

    @ApiPropertyOptional({ description: '다운로드 URL', example: 'https://example.com/file.pdf' })
    @IsUrl()
    @IsOptional()
    url?: string;

    @ApiPropertyOptional({ description: '해당 모델명', example: 'BR05' })
    @IsString()
    @IsOptional()
    model?: string;
}

/**
 * 매칭 제품 DTO
 */
export class MatchingProductDto {
    @ApiPropertyOptional({ description: '제품 타입', example: 'Cylinder' })
    @IsString()
    @IsOptional()
    type?: string;

    @ApiPropertyOptional({ description: '모델명', example: 'CYL-100' })
    @IsString()
    @IsOptional()
    model?: string;

    @ApiPropertyOptional({ description: '제품명', example: 'Hydraulic Cylinder' })
    @IsString()
    @IsOptional()
    productName?: string;

    @ApiPropertyOptional({ description: '제품 상세 URL', example: 'https://example.com/product' })
    @IsUrl()
    @IsOptional()
    url?: string;

    @ApiPropertyOptional({ description: '이미지 URL', example: 'https://example.com/image.jpg' })
    @IsUrl()
    @IsOptional()
    imageUrl?: string;
}

/**
 * 제품 생성 요청 DTO
 */
export class CreateProductRequestDto {
    @ApiProperty({ description: '제품 슬러그 (URL 친화적, 고유값)', example: 'br-plus-series' })
    @IsString()
    @IsNotEmpty()
    slug: string;

    @ApiProperty({ description: '제품 코드 (레거시 호환용)', example: 'BR-PLUS-001' })
    @IsString()
    @IsNotEmpty()
    productCode: string;

    @ApiProperty({ description: '제품명', example: 'BR-PLUS Series Chuck' })
    @IsString()
    @IsNotEmpty()
    productName: string;

    @ApiPropertyOptional({ description: '한국어 제품명', example: 'BR-PLUS 시리즈 척' })
    @IsString()
    @IsOptional()
    productNameKo?: string;

    @ApiProperty({ description: '카테고리 정보', type: CategoryDto })
    @ValidateNested()
    @Type(() => CategoryDto)
    category: CategoryDto;

    @ApiPropertyOptional({ description: '제품 설명' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: '한국어 설명' })
    @IsString()
    @IsOptional()
    descriptionKo?: string;

    @ApiPropertyOptional({ description: '원본 Kitagawa 페이지 URL' })
    @IsUrl()
    @IsOptional()
    sourceUrl?: string;

    @ApiPropertyOptional({ description: '이미지 URL 배열', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    imageUrls?: string[];

    @ApiPropertyOptional({ description: '메인 이미지 URL' })
    @IsUrl()
    @IsOptional()
    mainImageUrl?: string;

    @ApiPropertyOptional({ description: '제품 사양 HTML' })
    @IsString()
    @IsOptional()
    specificationHtml?: string;

    @ApiPropertyOptional({ description: '모델별 사양 정보', type: [ModelSpecificationDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ModelSpecificationDto)
    @IsOptional()
    models?: ModelSpecificationDto[];

    @ApiPropertyOptional({ description: '사용 가능한 모델 목록', type: [String] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    availableModels?: string[];

    @ApiPropertyOptional({ description: '다운로드 링크', type: [DownloadLinkDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DownloadLinkDto)
    @IsOptional()
    downloads?: DownloadLinkDto[];

    @ApiPropertyOptional({ description: '매칭 제품', type: [MatchingProductDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => MatchingProductDto)
    @IsOptional()
    matchingProducts?: MatchingProductDto[];

    @ApiPropertyOptional({ description: '추가 정보', example: { feature1: 'value1' } })
    @IsObject()
    @IsOptional()
    additionalInfo?: Record<string, any>;

    @ApiPropertyOptional({ description: '검색 태그', type: [String], example: ['chuck', 'hydraulic'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    tags?: string[];

    @ApiPropertyOptional({ description: '활성화 상태', example: true, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiPropertyOptional({ description: '추천 제품 여부', example: false, default: false })
    @IsBoolean()
    @IsOptional()
    isFeatured?: boolean;

    @ApiPropertyOptional({ description: '우선순위 (높을수록 상위 노출)', example: 0, default: 0 })
    @IsNumber()
    @Min(0)
    @IsOptional()
    priority?: number;

    @ApiPropertyOptional({ description: 'PDF 카탈로그 URL' })
    @IsUrl()
    @IsOptional()
    pdfUrl?: string;

    @ApiPropertyOptional({ description: 'YouTube 영상 URL' })
    @IsUrl()
    @IsOptional()
    youtubeUrl?: string;
}
