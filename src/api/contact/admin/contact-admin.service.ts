import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { DiscordWebhookService } from '../../../common/service/discord-webhook.service';
import { ProductCrawlerService } from '../../../common/service/product-crawler.service';

import { CompanyInfo, CompanyInfoDocument } from '../../../schema/company-info.schema';
import { ContactRequest, ContactRequestDocument } from '../../../schema/contact-request.schema';
import {
    ImportStatus,
    AdminContactRequest,
    AdminContactRequestType,
    AdminContactRequestDocument,
} from '../../../schema/admin-contact-request.schema';

import { ContactAdminFilterRequestDto } from './dto/request/contact-admin-filter-request.dto';
import { ContactAdminCreateRequestDto } from './dto/request/contact-admin-create-request.dto';
import { ContactAdminInfoUpdateRequestDto } from './dto/request/contact-admin-info-update-request.dto';
import { ContactAdminUpdateStatusRequestDto } from './dto/request/contact-admim-update-status-request.dto';
import { ContactInfoResponseDto } from '../dto/response/contact-info-response.dto';
import { ContactAdminDetailResponseDto } from './dto/response/contact-admin-response.dto';
import {
    ContactAdminRequestListResponseDto,
    ContactAdminRequestDetailResponseDto,
} from './dto/response/contact-admin-request-response.dto';

/**
 * Contact Admin Service
 * 문의 관리 기능
 */
@Injectable()
export class ContactAdminService {
    constructor(
        @InjectModel(ContactRequest.name)
        private readonly contactRequestModel: Model<ContactRequestDocument>,
        @InjectModel(CompanyInfo.name)
        private readonly companyInfoModel: Model<CompanyInfoDocument>,
        @InjectModel(AdminContactRequest.name)
        private readonly adminContactRequestModel: Model<AdminContactRequestDocument>,
        private readonly discordWebhookService: DiscordWebhookService,
        private readonly productCrawlerService: ProductCrawlerService,
    ) {}

    /**
     * 문의 목록 조회
     */
    async findAll(filterDto: ContactAdminFilterRequestDto) {
        const { keyword, status, page = 1, limit = 20 } = filterDto;

        // 필터 조건 구성
        const filter: any = {};

        if (keyword) {
            filter.$or = [
                { managerName: { $regex: keyword, $options: 'i' } },
                { companyName: { $regex: keyword, $options: 'i' } },
                { email: { $regex: keyword, $options: 'i' } },
                { message: { $regex: keyword, $options: 'i' } },
            ];
        }

        if (status) {
            filter.status = status;
        }

        // 페이지네이션
        const skip = (page - 1) * limit;

        const [contacts, total] = await Promise.all([
            this.contactRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.contactRequestModel.countDocuments(filter).exec(),
        ]);

        return {
            contacts: contacts.map(this.toResponseDto),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: skip + limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * 문의 상세 조회
     */
    async findById(id: string): Promise<ContactAdminDetailResponseDto> {
        const contact = await this.contactRequestModel.findById(id).lean().exec();

        if (!contact) {
            throw new BadRequestException('문의를 찾을 수 없습니다');
        }

        return this.toResponseDto(contact);
    }

    /**
     * 문의 상태 업데이트
     */
    async updateStatus(
        id: string,
        updateDto: ContactAdminUpdateStatusRequestDto,
        adminId?: string,
    ): Promise<ContactAdminDetailResponseDto> {
        const updateData: any = {
            status: updateDto.status,
        };

        if (updateDto.adminNote) {
            updateData.adminNote = updateDto.adminNote;
        }

        // 상태가 COMPLETED나 REJECTED로 변경되는 경우 처리 완료 시간 기록
        if (updateDto.status === 'COMPLETED' || updateDto.status === 'REJECTED') {
            updateData.processedAt = new Date();
            if (adminId) {
                updateData.processedBy = adminId;
            }
        }

        const contact = await this.contactRequestModel.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();

        return this.toResponseDto(contact);
    }

    /**
     * 문의 삭제
     */
    async delete(id: string): Promise<void> {
        const result = await this.contactRequestModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new BadRequestException('문의를 찾을 수 없습니다');
        }
    }

    /**
     * 회사 연락처 정보 조회 (관리자용)
     */
    async getContactInfo(): Promise<ContactInfoResponseDto> {
        const companyInfo: any = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            throw new BadRequestException('회사 정보를 찾을 수 없습니다');
        }

        return {
            companyName: companyInfo.companyName,
            ceo: companyInfo.ceo,
            address: companyInfo.address,
            phone: companyInfo.phone,
            mobile: companyInfo.mobile,
            fax: companyInfo.fax,
            email: companyInfo.email,
            website: companyInfo.website,
            locations: companyInfo.locations.map((loc: any) => ({
                name: loc.name,
                type: loc.type as 'headquarters' | 'service_center' | 'factory',
                address: loc.address,
                phone: loc.phone,
                fax: loc.fax,
                coordinates: loc.coordinates,
            })),
        };
    }

    /**
     * 회사 연락처 정보 수정 (관리자용)
     */
    async updateContactInfo(updateDto: ContactAdminInfoUpdateRequestDto): Promise<ContactInfoResponseDto> {
        // Singleton 패턴 - 기존 문서 찾기 또는 생성
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            // 문서가 없으면 새로 생성
            companyInfo = new this.companyInfoModel(updateDto);
        } else {
            // 문서가 있으면 업데이트
            Object.assign(companyInfo, updateDto);
        }

        await companyInfo.save();

        return this.getContactInfo();
    }

    /**
     * Entity to DTO 변환
     */
    private toResponseDto(contact: any): ContactAdminDetailResponseDto {
        return {
            _id: contact._id.toString(),
            managerName: contact.managerName,
            companyName: contact.companyName,
            email: contact.email,
            phone: contact.phone,
            message: contact.message,
            attachmentUrl: contact.attachmentUrl,
            privacyConsent: contact.privacyConsent,
            status: contact.status,
            adminNote: contact.adminNote,
            processedAt: contact.processedAt,
            processedBy: contact.processedBy,
            createdAt: contact.createdAt,
            updatedAt: contact.updatedAt,
        };
    }

    /**
     * ====================
     * Admin Contact Request 관련 메서드
     * Figma: Admin Contact Here 페이지
     * ====================
     */

    /**
     * Admin Contact Request 생성
     * 관리자가 새 제품 추가 또는 요청사항 제출
     */
    async createAdminContactRequest(
        createDto: ContactAdminCreateRequestDto,
        adminId: string,
    ): Promise<ContactAdminRequestDetailResponseDto> {
        // 요청 유형 결정
        const hasProductInfo = !!(
            createDto.productName ||
            createDto.seriesName ||
            createDto.url ||
            createDto.productImageUrl ||
            (createDto.productImageUrls && createDto.productImageUrls.length > 0) ||
            (createDto.attachedFiles && createDto.attachedFiles.length > 0)
        );
        const hasRequestDetails = !!createDto.requestDetails;

        let type: AdminContactRequestType;
        if (hasProductInfo && hasRequestDetails) {
            type = AdminContactRequestType.MIXED;
        } else if (hasProductInfo) {
            type = AdminContactRequestType.NEW_PRODUCT;
        } else {
            type = AdminContactRequestType.GENERAL_REQUEST;
        }

        // Import 상태 설정
        const autoImport = createDto.autoImport || false;
        const importStatus = autoImport ? ImportStatus.PENDING : ImportStatus.NONE;

        // 요청 생성
        const request = await this.adminContactRequestModel.create({
            ...createDto,
            type,
            requestedBy: adminId,
            autoImport,
            importStatus,
        });

        const requestDto = this.toAdminContactRequestDto(request);

        // Discord 웹훅 알림 전송 (비동기, 실패해도 요청 생성은 성공)
        this.discordWebhookService
            .sendAdminContactRequestNotification({
                requestId: request._id.toString(),
                type,
                productName: createDto.productName,
                seriesName: createDto.seriesName,
                url: createDto.url,
                requestDetails: createDto.requestDetails,
                requestedBy: adminId,
                autoImport,
            })
            .catch((err) => console.error('Discord 웹훅 전송 실패:', err));

        // 자동 Import가 활성화된 경우 크롤링 시작 (비동기)
        if (autoImport && createDto.url) {
            this.startAutoImport(request._id.toString(), createDto.url).catch((err) =>
                console.error('자동 Import 시작 실패:', err),
            );
        }

        return requestDto;
    }

    /**
     * 자동 Import 시작 (비동기)
     */
    private async startAutoImport(requestId: string, url: string): Promise<void> {
        try {
            // 상태를 IN_PROGRESS로 변경
            await this.adminContactRequestModel.findByIdAndUpdate(requestId, {
                importStatus: ImportStatus.IN_PROGRESS,
            });

            // 크롤링 실행
            const resourceIds = await this.productCrawlerService.crawlAndImportProduct(url);

            // 성공 시 상태를 COMPLETED로 변경
            await this.adminContactRequestModel.findByIdAndUpdate(requestId, {
                importStatus: ImportStatus.COMPLETED,
                importedResourceIds: resourceIds,
            });

            // Discord 완료 알림
            await this.discordWebhookService.sendImportCompletedNotification({
                requestId,
                success: true,
                resourceCount: resourceIds.length,
            });
        } catch (error) {
            // 실패 시 상태를 FAILED로 변경
            await this.adminContactRequestModel.findByIdAndUpdate(requestId, {
                importStatus: ImportStatus.FAILED,
                importError: error.message,
            });

            // Discord 실패 알림
            await this.discordWebhookService.sendImportCompletedNotification({
                requestId,
                success: false,
                errorMessage: error.message,
            });
        }
    }

    /**
     * Admin Contact Request 목록 조회
     */
    async findAllAdminContactRequests(
        filterDto: ContactAdminFilterRequestDto,
    ): Promise<{ requests: ContactAdminRequestListResponseDto[]; pagination: any }> {
        const { keyword, status, page = 1, limit = 20 } = filterDto;

        // 필터 조건
        const filter: any = {};

        if (keyword) {
            filter.$or = [
                { productName: { $regex: keyword, $options: 'i' } },
                { seriesName: { $regex: keyword, $options: 'i' } },
                { requestDetails: { $regex: keyword, $options: 'i' } },
                { requestedBy: { $regex: keyword, $options: 'i' } },
            ];
        }

        if (status) {
            filter.status = status;
        }

        // 페이지네이션
        const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
            this.adminContactRequestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
            this.adminContactRequestModel.countDocuments(filter).exec(),
        ]);

        return {
            requests: requests.map(this.toAdminContactRequestListDto),
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit,
                hasNextPage: skip + limit < total,
                hasPreviousPage: page > 1,
            },
        };
    }

    /**
     * Admin Contact Request 상세 조회
     */
    async findAdminContactRequestById(id: string): Promise<ContactAdminRequestDetailResponseDto> {
        const request = await this.adminContactRequestModel.findById(id).lean().exec();

        if (!request) {
            throw new BadRequestException('요청을 찾을 수 없습니다');
        }

        return this.toAdminContactRequestDto(request);
    }

    /**
     * Admin Contact Request Entity to DTO 변환
     */
    private toAdminContactRequestDto(request: any): ContactAdminRequestDetailResponseDto {
        return {
            _id: request._id.toString(),
            type: request.type,
            productName: request.productName,
            seriesName: request.seriesName,
            url: request.url,
            requestDetails: request.requestDetails,
            status: request.status,
            requestedBy: request.requestedBy,
            adminNote: request.adminNote,
            processedAt: request.processedAt,
            processedBy: request.processedBy,
            createdAt: request.createdAt,
            updatedAt: request.updatedAt,
            autoImport: request.autoImport,
            importStatus: request.importStatus,
            importError: request.importError,
            importedResourceIds: request.importedResourceIds || [],
            productImageUrl: request.productImageUrl,
            productImageUrls: request.productImageUrls || [],
            attachedFiles: request.attachedFiles || [],
        };
    }

    /**
     * Admin Contact Request Entity to List DTO 변환
     */
    private toAdminContactRequestListDto(request: any): ContactAdminRequestListResponseDto {
        return {
            _id: request._id.toString(),
            type: request.type,
            productName: request.productName,
            seriesName: request.seriesName,
            requestDetailsSummary: request.requestDetails
                ? request.requestDetails.substring(0, 50) + (request.requestDetails.length > 50 ? '...' : '')
                : undefined,
            status: request.status,
            requestedBy: request.requestedBy,
            createdAt: request.createdAt,
            importStatus: request.importStatus,
        };
    }

    /**
     * 수동 Import 실행
     */
    async triggerManualImport(requestId: string): Promise<ContactAdminRequestDetailResponseDto> {
        const request = await this.adminContactRequestModel.findById(requestId);

        if (!request) {
            throw new BadRequestException('요청을 찾을 수 없습니다');
        }

        if (!request.url) {
            throw new BadRequestException('URL이 없어 Import를 실행할 수 없습니다');
        }

        if (request.importStatus === ImportStatus.IN_PROGRESS) {
            throw new BadRequestException('이미 Import가 진행 중입니다');
        }

        // Import 시작
        this.startAutoImport(requestId, request.url).catch((err) => console.error('수동 Import 시작 실패:', err));

        // 상태를 PENDING으로 변경하고 반환
        const updated = await this.adminContactRequestModel.findByIdAndUpdate(
            requestId,
            { importStatus: ImportStatus.PENDING },
            { new: true },
        );

        return this.toAdminContactRequestDto(updated);
    }
}
