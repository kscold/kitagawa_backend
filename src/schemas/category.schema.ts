import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = CategoryModel & Document;

// 카테고리 구조를 저장하기 위한 스키마
@Schema({ timestamps: true })
export class CategoryModel {
    @Prop({ required: true, unique: true })
    name: string; // 카테고리명 예: "Chucks"

    @Prop({ required: true })
    nameKo: string; // 한국어 카테고리명

    @Prop()
    slug: string; // URL용 슬러그

    @Prop()
    description: string;

    @Prop()
    descriptionKo: string;

    @Prop()
    parentCategory: string; // 부모 카테고리 (null이면 최상위)

    @Prop([String])
    subCategories: string[]; // 하위 카테고리 목록

    @Prop()
    iconUrl: string; // 카테고리 아이콘 이미지

    @Prop()
    imageUrl: string; // 카테고리 대표 이미지

    @Prop({ default: 0 })
    order: number; // 정렬 순서

    @Prop({ default: true })
    isActive: boolean;

    @Prop()
    sourceUrl: string; // Kitagawa 원본 페이지 URL
}

export const CategorySchema = SchemaFactory.createForClass(CategoryModel);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentCategory: 1 });
