import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CompanyInfo, CompanyInfoDocument } from '../../../schemas/company-info.schema';
import { ContactRequest, ContactRequestDocument } from '../../../schemas/contact-request.schema';

import { ContactAdminFilterDto } from './dto/request/contact-admin-filter.dto';
import { UpdateContactStatusDto } from './dto/request/update-contact-status.dto';
import { UpdateContactInfoRequestDto } from './dto/request/update-contact-info-request.dto';
import { ContactInfoResponseDto } from '../dto/response/contact-info-response.dto';
import { ContactAdminDetailResponseDto } from './dto/response/contact-admin-response.dto';

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
    ) {}

    /**
     * 문의 목록 조회
     */
    async findAll(filterDto: ContactAdminFilterDto) {
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
        updateDto: UpdateContactStatusDto,
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
    async updateContactInfo(updateDto: UpdateContactInfoRequestDto): Promise<ContactInfoResponseDto> {
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
}
