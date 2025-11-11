import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    Min,
    IsUrl,
    IsArray,
    IsNumber,
    IsObject,
    IsString,
    IsBoolean,
    IsNotEmpty,
    IsOptional,
    ValidateNested,
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
 * 제품 생성 요청 DTO
 */
export class CreateProductRequestDto {
    @ApiProperty({
        description: '제품 슬러그 (URL 친화적인 고유 식별자)',
        example: 'brbr-plus-series',
    })
    @IsString()
    @IsNotEmpty()
    slug: string;

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

    @ApiPropertyOptional({ description: '다운로드 링크', type: [DownloadLinkDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => DownloadLinkDto)
    @IsOptional()
    downloads?: DownloadLinkDto[];

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
