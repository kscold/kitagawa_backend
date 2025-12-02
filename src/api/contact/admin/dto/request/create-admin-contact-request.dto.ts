import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl, ValidateIf, IsBoolean } from 'class-validator';

/**
 * Admin Contact Request 생성 DTO
 * Figma: Admin Contact Here 폼
 *
 * 새로운 제품 추가 또는 요청사항 제출
 * - 최소 1개 이상의 필드가 필수
 */
export class CreateAdminContactRequestDto {
    /**
     * 제품명 (선택)
     * 새로운 제품 추가시 제품명
     */
    @ApiProperty({
        description: '제품명 (새로운 제품 추가시)',
        example: 'BB series',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: '제품명은 100자 이하여야 합니다' })
    productName?: string;

    /**
     * 시리즈명 (선택)
     * 새로운 제품 추가시 시리즈명
     */
    @ApiProperty({
        description: '시리즈명 (새로운 제품 추가시)',
        example: 'Power Chuck',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: '시리즈명은 100자 이하여야 합니다' })
    seriesName?: string;

    /**
     * URL (선택)
     * 새로운 제품의 참고 URL (일본 사이트 등)
     */
    @ApiProperty({
        description: 'URL (새로운 제품의 참고 URL)',
        example: 'https://www.kitagawa.co.jp/products/bb-series',
        required: false,
    })
    @IsOptional()
    @IsUrl({}, { message: '올바른 URL 형식이 아닙니다' })
    @MaxLength(500, { message: 'URL은 500자 이하여야 합니다' })
    url?: string;

    /**
     * 요청 사항 (선택)
     * 기타 요청사항이나 문의사항
     */
    @ApiProperty({
        description: '요청 사항',
        example: '기존 제품의 스펙 업데이트가 필요합니다',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000, { message: '요청 사항은 1000자 이하여야 합니다' })
    requestDetails?: string;

    /**
     * 자동 Import 여부 (선택)
     * true인 경우 요청 생성 시 자동으로 크롤링 시작
     */
    @ApiProperty({
        description: '자동 Import 여부 (체크 시 자동으로 크롤링 시작)',
        example: false,
        required: false,
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'autoImport는 boolean 값이어야 합니다' })
    autoImport?: boolean;

    /**
     * 커스텀 validator: 최소 1개 필드는 필수
     * Figma 디자인: "1개 이상의 항목을 작성해 주시기 바랍니다."
     */
    @ApiHideProperty()
    @ValidateIf((o) => !o.productName && !o.seriesName && !o.url && !o.requestDetails)
    @IsString({ message: '1개 이상의 항목을 작성해 주시기 바랍니다' })
    _atLeastOneField?: never;
}
