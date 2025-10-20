import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { ContactRequest, ContactRequestDocument } from '../../schemas/contact-request.schema';
import { CreateContactRequestDto } from './dto/request/create-contact-request.dto';
import { ContactInfoResponseDto, LocationInfo } from './dto/response/contact-info-response.dto';

/**
 * Contact Public Service
 * 서비스 문의 접수 및 연락처 정보 조회
 */
@Injectable()
export class ContactService {
    constructor(
        @InjectModel(ContactRequest.name)
        private readonly contactRequestModel: Model<ContactRequestDocument>,
    ) {}

    /**
     * 서비스 문의 접수
     */
    async createContactRequest(createDto: CreateContactRequestDto): Promise<ContactRequestDocument> {
        const contactRequest = new this.contactRequestModel({
            ...createDto,
            status: 'PENDING',
        });

        return await contactRequest.save();
    }

    /**
     * 회사 연락처 정보 조회
     * 실제로는 DB에서 관리되어야 하지만, 현재는 하드코딩된 정보 반환
     */
    async getContactInfo(): Promise<ContactInfoResponseDto> {
        // TODO: 이후 DB에서 관리할 수 있도록 CompanyInfo Schema 생성 필요
        const contactInfo: ContactInfoResponseDto = {
            companyName: 'Korea Kitagawa Co., Ltd.',
            companyNameKo: '(주) 한국 기타가와',
            ceo: '최민형',
            address: '서울 금천구 가산디지털1로 168 우림라이온스벨리 B동 803호',
            phone: '02-2026-2222',
            mobile: '010-3616-9973',
            fax: '02-2026-2223',
            email: 'kiw@kitagawa.co.kr',
            website: 'https://www.kitagawa.co.kr',
            locations: [
                {
                    name: 'Headquarters',
                    nameKo: '본사',
                    type: 'headquarters',
                    address: '서울 금천구 가산디지털1로 168 우림라이온스벨리 B동 803호',
                    phone: '02-2026-2222',
                    fax: '02-2026-2223',
                    coordinates: {
                        lat: 37.4812845,
                        lng: 126.8821449,
                    },
                },
                {
                    name: 'Ansan Service Center',
                    nameKo: '안산 서비스 센터',
                    type: 'service_center',
                    address: '경기도 안산시 단원구 별망로 11, 안산 SW벤처타워 303호',
                    phone: '031-123-4567',
                    coordinates: {
                        lat: 37.3212,
                        lng: 126.8309,
                    },
                },
            ],
        };

        return contactInfo;
    }
}
