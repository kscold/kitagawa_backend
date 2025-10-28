import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ContactRequest, ContactRequestDocument } from '../../../schemas/contact-request.schema';
import { ContactAdminFilterDto } from './dto/request/contact-admin-filter.dto';
import { UpdateContactStatusDto } from './dto/request/update-contact-status.dto';
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
            throw new NotFoundException('문의를 찾을 수 없습니다');
        }

        return this.toResponseDto(contact);
    }

    /**
     * 문의 상태 업데이트
     */
    async updateStatus(id: string, updateDto: UpdateContactStatusDto, adminId?: string): Promise<ContactAdminDetailResponseDto> {
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

        if (!contact) {
            throw new NotFoundException('문의를 찾을 수 없습니다');
        }

        return this.toResponseDto(contact);
    }

    /**
     * 문의 삭제
     */
    async delete(id: string): Promise<void> {
        const result = await this.contactRequestModel.findByIdAndDelete(id).exec();

        if (!result) {
            throw new NotFoundException('문의를 찾을 수 없습니다');
        }
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
