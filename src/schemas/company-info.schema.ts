import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyInfoDocument = CompanyInfo & Document;

/**
 * Company History Item (회사 연혁)
 */
export class HistoryItem {
    @Prop({ required: true })
    year: string; // 연도 (예: "2020")

    @Prop({ required: true })
    month?: string; // 월 (예: "03", 선택)

    @Prop({ required: true })
    description: string; // 설명 (영어)

    @Prop({ required: true })
    descriptionKo: string; // 설명 (한글)
}

/**
 * Certification Item (인증서/자격)
 */
export class CertificationItem {
    @Prop({ required: true })
    name: string; // 인증명 (영어)

    @Prop({ required: true })
    nameKo: string; // 인증명 (한글)

    @Prop()
    issuer?: string; // 발급 기관

    @Prop()
    issuerKo?: string; // 발급 기관 (한글)

    @Prop()
    issuedDate?: string; // 발급일 (YYYY-MM-DD)

    @Prop()
    certificateUrl?: string; // 인증서 이미지 URL
}

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

    @Prop({ type: [HistoryItem], default: [] })
    history: HistoryItem[]; // 회사 연혁

    @Prop()
    vision?: string; // 비전 (영어)

    @Prop()
    visionKo?: string; // 비전 (한글)

    @Prop()
    mission?: string; // 미션 (영어)

    @Prop()
    missionKo?: string; // 미션 (한글)

    @Prop({ type: [CertificationItem], default: [] })
    certifications: CertificationItem[]; // 인증서/자격 목록

    @Prop({ default: true })
    isActive: boolean; // 활성화 여부
}

export const CompanyInfoSchema = SchemaFactory.createForClass(CompanyInfo);
