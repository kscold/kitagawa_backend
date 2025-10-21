import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

// 카테고리 스키마
@Schema({ _id: false })
export class Category {
    @Prop({ required: true })
    mainCategory: string; // 예: "Chucks"

    @Prop()
    subCategory: string; // 예: "Standard Chucks with Wedge" (optional)

    @Prop()
    series: string; // 예: "BR/BR-PLUS Series"
}

// 다운로드 링크 스키마
@Schema({ _id: false })
export class DownloadLink {
    @Prop()
    type: string; // 예: "PDF", "DXF", "DWG", "Parasolid", "STEP"

    @Prop()
    category: string; // 예: "2D", "3D"

    @Prop()
    url: string;

    @Prop()
    model: string; // 해당 모델명
}

// 메인 제품 스키마
@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, unique: true })
    slug: string; // 예: "brbr-plus-series" (URL 친화적인 고유 식별자)

    @Prop({ required: true })
    productName: string; // 제품명

    @Prop()
    productNameKo: string; // 한국어 제품명

    @Prop({ type: Category, required: true })
    category: Category;

    @Prop()
    sourceUrl: string; // 원본 Kitagawa 페이지 URL

    @Prop([String])
    imageUrls: string[]; // 제품 이미지 URL 배열

    @Prop()
    mainImageUrl: string; // 메인 이미지 URL

    @Prop({ type: String })
    specificationHtml: string; // Product Specifications HTML (원본 그대로 저장)

    @Prop({ type: [DownloadLink] })
    downloads: DownloadLink[]; // 다운로드 가능한 파일들

    @Prop({ type: Object })
    additionalInfo: Record<string, any>; // 추가 정보를 위한 유연한 필드

    @Prop([String])
    tags: string[]; // 검색을 위한 태그

    @Prop({ default: true })
    isActive: boolean; // 활성화 상태

    @Prop({ default: false })
    isFeatured: boolean; // 추천 제품 여부

    @Prop({ default: 0 })
    viewCount: number; // 조회수

    @Prop({ default: 0 })
    priority: number; // 우선순위 (높을수록 상위 노출)

    @Prop()
    pdfUrl: string; // PDF 카탈로그 URL

    @Prop()
    youtubeUrl: string; // YouTube 영상 URL

    @Prop({ type: Object })
    metadata: {
        lastCrawled?: Date;
        crawlSource?: string;
        version?: string;
    };
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// 인덱스 생성
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ 'category.mainCategory': 1, 'category.subCategory': 1 });
ProductSchema.index({ 'category.series': 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isActive: 1 });
