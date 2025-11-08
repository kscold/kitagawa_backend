import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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

// 다운로드 항목 스키마 (드롭다운 내부 항목용)
@Schema({ _id: false })
export class DownloadItem {
    @Prop()
    title: string; // 항목 이름 (예: "B-200 series")

    @Prop()
    url: string; // 항목 URL
}

// 다운로드 링크 스키마
@Schema({ _id: false })
export class DownloadLink {
    @Prop()
    type: string; // 예: "PDF", "DXF", "DWG", "Parasolid", "STEP"

    @Prop()
    category: string; // 예: "Catalog", "Manual", "2D", "3D"

    @Prop()
    title: string; // 다운로드 버튼 이름 (예: "Down load Catalogue pages (PDF)", "Download instruction manual (PDF)")

    @Prop()
    url?: string; // 단일 다운로드 URL (Manual 등)

    @Prop({ type: [DownloadItem] })
    items?: DownloadItem[]; // 드롭다운 항목들 (Catalog 등, url이 없을 때 사용)
}

// 메인 제품 스키마
@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, unique: true })
    slug: string; // 예: "brbr-plus-series" (URL 친화적인 고유 식별자)

    @Prop()
    productName: string; // 제품명

    @Prop()
    productTitle: string; // 제품 타이틀 (category.series 복사본)

    @Prop({ type: Category, required: true })
    category: Category;

    @Prop()
    sourceUrl: string; // 원본 Kitagawa 페이지 URL

    @Prop({ type: [String] })
    imageUrls: string[]; // 제품 이미지 URL 배열

    @Prop()
    mainImageUrl: string; // 메인 이미지 URL

    @Prop({ type: String })
    content: string; // 제품 설명 (짧은 소개 텍스트)

    @Prop({ type: String })
    contentDetail: string; // 제품 상세 설명 (catch phrase)

    @Prop({ type: String })
    description: string; // 제품 특징 리스트 (<ul class="listType01"> 내용, \n으로 구분)

    @Prop({ type: String })
    specificationHtml: string; // Product Specifications HTML (원본 그대로 저장)

    @Prop({ type: [DownloadLink] })
    downloads: DownloadLink[]; // 다운로드 가능한 파일들 (카탈로그/매뉴얼)

    @Prop({ type: [DownloadLink] })
    specificationFiles: DownloadLink[]; // Specification 테이블의 기술 도면 파일들 (PDF/DWG)

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
    order: number; // 전역 정렬 순서 (낮을수록 우선 노출)

    @Prop({ default: 0 })
    orderInLevel1: number; // Level 1 카테고리 내 정렬 순서

    @Prop({ default: 0 })
    orderInLevel2: number; // Level 2 카테고리 내 정렬 순서

    @Prop()
    pdfUrl: string; // PDF 카탈로그 URL

    @Prop({ type: [String] })
    youtubeUrl: string[]; // YouTube 영상 URL 배열

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
