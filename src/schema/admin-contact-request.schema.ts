import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminContactRequestDocument = AdminContactRequest & Document;

export enum AdminContactRequestStatus {
    PENDING = 'PENDING', // 대기 중
    IN_PROGRESS = 'IN_PROGRESS', // 처리 중
    COMPLETED = 'COMPLETED', // 완료
    REJECTED = 'REJECTED', // 거절
}

export enum AdminContactRequestType {
    NEW_PRODUCT = 'NEW_PRODUCT', // 새로운 제품 추가 요청
    GENERAL_REQUEST = 'GENERAL_REQUEST', // 일반 요청사항
    MIXED = 'MIXED', // 제품 추가 + 요청사항 혼합
}

export enum ImportStatus {
    NONE = 'NONE', // 자동 import 안함
    PENDING = 'PENDING', // 대기 중
    IN_PROGRESS = 'IN_PROGRESS', // 진행 중
    COMPLETED = 'COMPLETED', // 완료
    FAILED = 'FAILED', // 실패
}

/**
 * Admin Contact Request Schema
 * 관리자가 제출하는 내부 요청/문의
 * Figma: Admin Contact Here 페이지
 *
 * 용도:
 * 1. 새로운 제품 추가 요청 (제품명, 시리즈명, URL)
 * 2. 시스템 개선/변경 요청 (요청사항)
 */
@Schema({ timestamps: true, collection: 'admin_contact_requests' })
export class AdminContactRequest {
    /**
     * 요청 유형 (자동 계산)
     */
    @Prop({ type: String, enum: AdminContactRequestType, required: true })
    type: AdminContactRequestType;

    /**
     * 제품명 (선택)
     * 새로운 제품 추가시
     */
    @Prop({ maxlength: 100 })
    productName?: string;

    /**
     * 시리즈명 (선택)
     * 새로운 제품 추가시
     */
    @Prop({ maxlength: 100 })
    seriesName?: string;

    /**
     * URL (선택)
     * 새로운 제품의 참고 URL
     */
    @Prop({ maxlength: 500 })
    url?: string;

    /**
     * 요청 사항 (선택)
     * 기타 요청사항이나 문의사항 (최대 1000자)
     */
    @Prop({ maxlength: 1000 })
    requestDetails?: string;

    /**
     * 처리 상태
     */
    @Prop({ type: String, enum: AdminContactRequestStatus, default: AdminContactRequestStatus.PENDING })
    status: AdminContactRequestStatus;

    /**
     * 요청한 관리자 ID
     */
    @Prop({ required: true })
    requestedBy: string;

    /**
     * 관리자 메모 (처리 담당자가 작성)
     */
    @Prop()
    adminNote?: string;

    /**
     * 처리 완료 시간
     */
    @Prop()
    processedAt?: Date;

    /**
     * 처리한 관리자 ID
     */
    @Prop()
    processedBy?: string;

    /**
     * 자동 import 여부
     * true인 경우 요청 생성 시 자동으로 크롤링 시작
     */
    @Prop({ default: false })
    autoImport: boolean;

    /**
     * Import 상태
     */
    @Prop({ type: String, enum: ImportStatus, default: ImportStatus.NONE })
    importStatus: ImportStatus;

    /**
     * Import 에러 메시지
     */
    @Prop()
    importError?: string;

    /**
     * Import된 Resource ID 목록
     */
    @Prop({ type: [String], default: [] })
    importedResourceIds: string[];
}

export const AdminContactRequestSchema = SchemaFactory.createForClass(AdminContactRequest);

// 인덱스 설정
AdminContactRequestSchema.index({ createdAt: -1 }); // 최신순 정렬
AdminContactRequestSchema.index({ status: 1 }); // 상태별 필터링
AdminContactRequestSchema.index({ type: 1 }); // 유형별 필터링
AdminContactRequestSchema.index({ requestedBy: 1 }); // 요청자별 필터링
