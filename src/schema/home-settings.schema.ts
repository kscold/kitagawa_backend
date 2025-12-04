import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * 홈 이미지 정보
 */
export class HomeImage {
    @Prop({ required: true })
    url: string; // 이미지 URL

    @Prop({ required: true })
    order: number; // 정렬 순서 (0부터 시작)

    @Prop()
    alt?: string; // 이미지 alt 텍스트

    @Prop()
    altKo?: string; // 한글 alt 텍스트
}

/**
 * 홈 소개 정보
 */
export class HomeIntroduction {
    @Prop()
    title?: string; // 제목 (영문)

    @Prop()
    description?: string; // 설명 (영문)
}

/**
 * 홈페이지 설정 스키마
 * 단일 document로 관리 (Singleton 패턴)
 */
@Schema({ timestamps: true, collection: 'home_settings' })
export class HomeSettings {
    @Prop({ type: [HomeImage], default: [] })
    mainImages: HomeImage[]; // 대표 이미지 목록 (최대 5개)

    @Prop({ type: HomeIntroduction })
    introduction?: HomeIntroduction; // 홈 소개

    @Prop({ default: true })
    isActive: boolean; // 활성화 여부

    @Prop({ type: Object })
    metadata?: Record<string, any>; // 추가 메타데이터
}

export type HomeSettingsDocument = HomeSettings & Document;

export const HomeSettingsSchema = SchemaFactory.createForClass(HomeSettings);
