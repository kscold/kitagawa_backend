import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 자료실 타입
 */
export enum ResourceType {
    CATALOG = 'CATALOG', // 카탈로그
    MANUAL = 'MANUAL', // 사용 설명서
    TECHNICAL = 'TECHNICAL', // 기술 자료
    VIDEO = 'VIDEO', // 영상 자료
    BROCHURE = 'BROCHURE', // 브로슈어
    CERTIFICATE = 'CERTIFICATE', // 인증서
    OTHER = 'OTHER', // 기타
}

/**
 * 자료실 파일 정보
 */
export class ResourceFile {
    @Prop({ required: true })
    url: string; // 파일 URL

    @Prop({ required: true })
    fileName: string; // 파일명

    @Prop()
    fileSize?: number; // 파일 크기 (bytes)

    @Prop()
    mimeType?: string; // MIME 타입 (application/pdf, video/mp4 등)
}

/**
 * 자료실 스키마
 */
@Schema({ timestamps: true })
export class Resource {
    @Prop({ required: true })
    title: string; // 자료 제목 (영문)

    @Prop()
    titleKo?: string; // 자료 제목 (한글)

    @Prop()
    description?: string; // 설명 (영문)

    @Prop()
    descriptionKo?: string; // 설명 (한글)

    @Prop({ required: true, enum: ResourceType })
    type: ResourceType; // 자료 타입

    @Prop({ type: [String], default: [] })
    categories: string[]; // 관련 카테고리

    @Prop({ type: [String], default: [] })
    tags: string[]; // 태그

    @Prop({ type: ResourceFile })
    file?: ResourceFile; // 파일 정보 (단일 파일인 경우)

    @Prop({ type: ResourceFile })
    pdfFile?: ResourceFile; // PDF 파일 정보

    @Prop({ type: ResourceFile })
    dwgFile?: ResourceFile; // DWG 파일 정보

    @Prop()
    thumbnailUrl?: string; // 썸네일 이미지 URL

    @Prop()
    previewUrl?: string; // 미리보기 URL (영상인 경우 유튜브 URL 등)

    @Prop({ default: 0 })
    viewCount: number; // 조회수

    @Prop({ default: 0 })
    downloadCount: number; // 다운로드수

    @Prop({ default: true })
    isActive: boolean; // 활성화 여부

    @Prop({ default: false })
    isFeatured: boolean; // 추천 자료 여부

    @Prop({ default: 0 })
    order: number; // 정렬 순서

    @Prop()
    publishedAt?: Date; // 발행일

    @Prop({ type: Object })
    metadata?: Record<string, any>; // 추가 메타데이터
}

export type ResourceDocument = Resource & Document;

export const ResourceSchema = SchemaFactory.createForClass(Resource);

// 인덱스 설정
ResourceSchema.index({ title: 1 });
ResourceSchema.index({ titleKo: 1 });
ResourceSchema.index({ type: 1 });
ResourceSchema.index({ categories: 1 });
ResourceSchema.index({ tags: 1 });
ResourceSchema.index({ isActive: 1 });
ResourceSchema.index({ isFeatured: 1, order: 1 }); // 오름차순 정렬
ResourceSchema.index({ publishedAt: -1 });
ResourceSchema.index({ viewCount: -1 });
ResourceSchema.index({ downloadCount: -1 });
ResourceSchema.index({ 'metadata.productName': 1 }); // 제품명 검색용
ResourceSchema.index({ 'metadata.model': 1 }); // 모델명 검색용
