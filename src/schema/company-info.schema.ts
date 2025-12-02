import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CompanyInfoDocument = CompanyInfo & Document;

/**
 * Company Greeting (인사말)
 */
@Schema({ _id: false })
export class CompanyGreeting {
    @Prop({ required: true })
    title: string; // 제목

    @Prop({ required: true })
    content: string; // 내용

    @Prop()
    ceoName?: string; // 대표자명

    @Prop()
    ceoSignatureUrl?: string; // 서명 이미지 URL
}

/**
 * 위치 정보 (지점/서비스센터)
 */
@Schema({ _id: false })
export class LocationInfo {
    @Prop({ required: true })
    name: string; // 장소명

    @Prop({ required: true, enum: ['headquarters', 'service_center', 'factory'] })
    type: string; // 장소 타입

    @Prop({ required: true })
    address: string; // 주소

    @Prop()
    phone?: string; // 전화번호

    @Prop()
    fax?: string; // 팩스

    @Prop({ type: Object })
    coordinates?: {
        lat: number;
        lng: number;
    }; // 지도 좌표
}

/**
 * Company Info (회사 정보) Schema
 * Singleton 패턴 - 단일 문서만 존재
 */
@Schema({ timestamps: true, collection: 'company_info' })
export class CompanyInfo {
    // 인사말 정보
    @Prop({ type: CompanyGreeting })
    greeting?: CompanyGreeting; // 인사말

    @Prop()
    vision?: string; // 비전

    @Prop()
    mission?: string; // 미션

    // 연락처 정보
    @Prop({ required: true })
    companyName: string; // 회사명

    @Prop({ required: true })
    ceo: string; // 대표자

    @Prop({ required: true })
    address: string; // 본사 주소

    @Prop({ required: true })
    phone: string; // 대표 전화

    @Prop({ required: true })
    mobile: string; // 휴대전화

    @Prop()
    fax?: string; // 팩스

    @Prop({ required: true })
    email: string; // 이메일

    @Prop()
    website?: string; // 웹사이트

    @Prop({ type: [LocationInfo], default: [] })
    locations: LocationInfo[]; // 지점/서비스센터 목록

    @Prop({ default: true })
    isActive: boolean; // 활성화 여부
}

export const CompanyInfoSchema = SchemaFactory.createForClass(CompanyInfo);

// 인덱스 설정
CompanyInfoSchema.index({ companyName: 1 });
