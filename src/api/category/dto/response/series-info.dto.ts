import { ApiProperty } from '@nestjs/swagger';

/**
 * Series 정보 DTO
 * Level 2 카테고리 하위의 시리즈 정보
 */
export class SeriesInfoDto {
    @ApiProperty({
        example: 'MR series',
        description: '시리즈명',
    })
    name: string;

    @ApiProperty({
        example: 'mr-series',
        description: '시리즈 슬러그 (라우팅용)',
    })
    slug: string;

    @ApiProperty({
        example: 12,
        description: '해당 시리즈의 제품 수',
    })
    productCount: number;

    @ApiProperty({
        example: 'https://www.kitagawa.com/en/mtools/item/data/IMG/mr-series.jpg',
        description: '대표 이미지 URL',
        required: false,
    })
    imageUrl?: string;
}
