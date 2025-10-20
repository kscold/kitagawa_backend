import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

// 카테고리 스키마
@Schema({ _id: false })
export class Category {
    @Prop({ required: true })
    mainCategory: string; // 예: "Chucks"

    @Prop({ required: true })
    subCategory: string; // 예: "Standard Chucks with Wedge"

    @Prop()
    series: string; // 예: "BR/BR-PLUS Series"
}

// 모델별 사양 스키마
@Schema({ _id: false })
export class ModelSpecification {
    @Prop({ required: true })
    model: string; // 예: "BR05", "BR06"

    @Prop({ type: Object })
    specifications: Record<string, any>; // 동적 사양 필드
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

// 매칭 제품 스키마
@Schema({ _id: false })
export class MatchingProduct {
    @Prop()
    type: string; // 예: "Cylinder", "Soft Jaws", "Hard Jaws"

    @Prop()
    model: string; // 모델명

    @Prop()
    productName: string; // 제품명

    @Prop()
    url: string; // 제품 상세 페이지 URL

    @Prop()
    imageUrl: string; // 이미지 URL
}

// 메인 제품 스키마
@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, unique: true })
    productCode: string; // 예: "BR-PLUS Series" (레거시 호환용)

    @Prop({ required: true, unique: true })
    slug: string; // URL 친화적인 슬러그 (예: "br-plus-series", "ck-ckr-series")

    @Prop({ required: true })
    productName: string; // 제품명

    @Prop()
    productNameKo: string; // 한국어 제품명

    @Prop({ type: Category, required: true })
    category: Category;

    @Prop()
    description: string; // 제품 설명

    @Prop()
    descriptionKo: string; // 한국어 설명

    @Prop()
    sourceUrl: string; // 원본 Kitagawa 페이지 URL

    @Prop([String])
    imageUrls: string[]; // 제품 이미지 URL 배열

    @Prop()
    mainImageUrl: string; // 메인 이미지 URL

    @Prop({ type: String })
    specificationHtml: string; // Product Specifications HTML (원본 그대로 저장)

    @Prop({ type: [ModelSpecification] })
    models: ModelSpecification[]; // 모델별 사양 정보

    @Prop([String])
    availableModels: string[]; // 사용 가능한 모델 목록

    @Prop({ type: [DownloadLink] })
    downloads: DownloadLink[]; // 다운로드 가능한 파일들

    @Prop({ type: [MatchingProduct] })
    matchingProducts: MatchingProduct[]; // 매칭되는 실린더, 조 등

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
ProductSchema.index({ tags: 1 });
ProductSchema.index({ isActive: 1 });
