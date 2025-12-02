import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ContactRequestDocument = ContactRequest & Document;

export enum ContactRequestStatus {
    PENDING = 'PENDING', // 대기 중
    IN_PROGRESS = 'IN_PROGRESS', // 처리 중
    COMPLETED = 'COMPLETED', // 완료
    REJECTED = 'REJECTED', // 거절
}

/**
 * Contact Request (서비스 문의/접수) Schema
 * 피그마 "Contact Us" 페이지의 서비스 접수 폼 데이터
 */
@Schema({ timestamps: true, collection: 'contact_requests' })
export class ContactRequest {
    @Prop({ required: true })
    managerName: string; // 담당자명

    @Prop({ required: true })
    companyName: string; // 업체명

    @Prop({ required: true })
    email: string; // 이메일

    @Prop({ required: true })
    phone: string; // 전화번호 (하이픈 없이)

    @Prop({ required: true, maxlength: 200 })
    message: string; // 문의사항 (최대 200자)

    @Prop()
    attachmentUrl?: string; // 첨부파일 URL (선택)

    @Prop({ required: true, default: true })
    privacyConsent: boolean; // 개인정보 수집 동의

    @Prop({ type: String, enum: ContactRequestStatus, default: ContactRequestStatus.PENDING })
    status: ContactRequestStatus; // 처리 상태

    @Prop()
    adminNote?: string; // 관리자 메모

    @Prop()
    processedAt?: Date; // 처리 완료 시간

    @Prop()
    processedBy?: string; // 처리한 관리자 ID
}

export const ContactRequestSchema = SchemaFactory.createForClass(ContactRequest);

// 인덱스 설정
ContactRequestSchema.index({ createdAt: -1 }); // 최신순 정렬
ContactRequestSchema.index({ status: 1 }); // 상태별 필터링
ContactRequestSchema.index({ email: 1 }); // 이메일 검색
