import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = CategoryModel & Document;

// 카테고리 레벨 (2단계만 존재)
export enum CategoryLevel {
    LEVEL_1 = 1, // 대분류 (NC ROTARY TABLE, VISE, CHUCK, CYLINDER, WORK GRIPPER)
    LEVEL_2 = 2, // 중분류 (4축 표준사양, VE Power Vise, 유압 중공척 등)
}

// 2단계 카테고리 스키마
@Schema({ timestamps: true, collection: 'categories' })
export class CategoryModel {
    @Prop({ required: true })
    name: string; // 카테고리명 (영문) 예: "NC ROTARY TABLE", "4축 표준사양"

    @Prop({ required: true })
    nameKo: string; // 한국어 카테고리명

    @Prop({ required: true })
    slug: string; // URL용 슬러그

    @Prop()
    description: string;

    @Prop()
    descriptionKo: string;

    @Prop()
    content: string; // 카테고리 설명 (영문)

    // 계층 구조
    @Prop({ required: true, enum: CategoryLevel })
    level: CategoryLevel; // 1: 대분류, 2: 중분류

    @Prop({ type: String, default: null })
    parentName: string | null; // 부모 카테고리명 (level 2일 경우 대분류명)

    @Prop({ type: String, default: null })
    mainCategory: string | null; // 대분류명 (빠른 검색용)

    // 메타데이터
    @Prop()
    iconUrl: string; // 카테고리 아이콘

    @Prop()
    imageUrl: string; // 카테고리 대표 이미지

    @Prop({ default: 0 })
    order: number; // 정렬 순서

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ default: 0 })
    productCount: number; // 해당 카테고리의 제품 수
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);

// 인덱스 설정
CategorySchema.index({ slug: 1 }, { unique: true }); // slug는 unique 인덱스
CategorySchema.index({ level: 1 });
CategorySchema.index({ mainCategory: 1 });
CategorySchema.index({ parentName: 1 });
CategorySchema.index({ name: 1 });
