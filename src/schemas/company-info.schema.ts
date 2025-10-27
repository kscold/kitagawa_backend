import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyInfoDocument = CompanyInfo & Document;

/**
 * Company Greeting (인사말)
 */
export class CompanyGreeting {
    @Prop({ required: true })
    title: string; // 제목 (영어)

    @Prop({ required: true })
    titleKo: string; // 제목 (한글)

    @Prop({ required: true })
    content: string; // 내용 (영어)

    @Prop({ required: true })
    contentKo: string; // 내용 (한글)

    @Prop()
    ceoName?: string; // 대표자명

    @Prop()
    ceoSignatureUrl?: string; // 서명 이미지 URL
}

/**
 * Company Info (회사 정보) Schema
 * Singleton 패턴 - 단일 문서만 존재
 */
@Schema({ timestamps: true })
export class CompanyInfo {
    @Prop({ type: CompanyGreeting })
    greeting?: CompanyGreeting; // 인사말

    @Prop()
    vision?: string; // 비전 (영어)

    @Prop()
    visionKo?: string; // 비전 (한글)

    @Prop()
    mission?: string; // 미션 (영어)

    @Prop()
    missionKo?: string; // 미션 (한글)

    @Prop({ default: true })
    isActive: boolean; // 활성화 여부
}

export const CompanyInfoSchema = SchemaFactory.createForClass(CompanyInfo);
