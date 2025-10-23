import { ApiProperty } from '@nestjs/swagger';

/**
 * Level 1 카테고리 응답 DTO
 * 메인 페이지 카테고리 카드에 필요한 정보 포함
 */
export class Level1CategoryResponseDto {
    @ApiProperty({
        example: '68f3d059b9aaa2b9a0fb3559',
        description: '카테고리 ID',
    })
    _id: string;

    @ApiProperty({
        example: 'NC ROTARY TABLE',
        description: '카테고리명 (영문)',
    })
    name: string;

    @ApiProperty({
        example: 'NC 로터리 테이블',
        description: '카테고리명 (한글)',
    })
    nameKo: string;

    @ApiProperty({
        example: 'nc-rotary-table',
        description: 'URL 슬러그 (라우팅용)',
    })
    slug: string;

    @ApiProperty({
        example: 1,
        description: '카테고리 레벨 (1: 대분류)',
    })
    level: number;

    @ApiProperty({
        example: 'https://www.kitagawa.com/en/mtools/item/data/IMG/catalog.png',
        description: '카테고리 이미지 URL',
        required: false,
    })
    imageUrl?: string;

    @ApiProperty({
        example: 0,
        description: '정렬 순서',
    })
    order: number;

    @ApiProperty({
        example: true,
        description: '활성화 여부',
    })
    isActive: boolean;

    @ApiProperty({
        example: 12,
        description: '제품 수',
    })
    productCount: number;

    @ApiProperty({
        example: 'Compact & high accuracy Combination with chuck is available.',
        description: '카테고리 설명',
        required: false,
    })
    content?: string;

    /**
     * MongoDB Document를 Level1CategoryResponseDto로 변환
     */
    static fromDocument(doc: any): Level1CategoryResponseDto {
        return {
            _id: doc._id.toString(),
            name: doc.name,
            nameKo: doc.nameKo,
            slug: doc.slug,
            level: doc.level,
            imageUrl: doc.imageUrl,
            order: doc.order,
            isActive: doc.isActive,
            productCount: doc.productCount,
            content: doc.content,
        };
    }

    /**
     * 여러 Document를 변환
     */
    static fromDocuments(docs: any[]): Level1CategoryResponseDto[] {
        return docs.map((doc) => Level1CategoryResponseDto.fromDocument(doc));
    }
}
