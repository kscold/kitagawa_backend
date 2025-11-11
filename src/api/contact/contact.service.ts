import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UploadService } from '../upload/upload.service';
import { EmailService } from '../../common/service/email.service';

import { CompanyInfo, CompanyInfoDocument } from '../../schemas/company-info.schema';
import { ContactRequest, ContactRequestDocument } from '../../schemas/contact-request.schema';

import { CreateContactRequestDto } from './dto/request/create-contact-request.dto';
import { ContactInfoResponseDto } from './dto/response/contact-info-response.dto';

/**
 * Contact Public Service
 * 서비스 문의 접수 및 연락처 정보 조회
 */
@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);

    constructor(
        private readonly emailService: EmailService,
        private readonly uploadService: UploadService,

        @InjectModel(ContactRequest.name)
        private readonly contactRequestModel: Model<ContactRequestDocument>,
        @InjectModel(CompanyInfo.name)
        private readonly companyInfoModel: Model<CompanyInfoDocument>,
    ) {}

    /**
     * 문의 첨부파일 업로드
     */
    async uploadAttachment(file: Express.Multer.File): Promise<string> {
        // contact 폴더에 업로드
        return this.uploadService.uploadFile(file, 'contact');
    }

    /**
     * 서비스 문의 접수
     */
    async createContactRequest(createDto: CreateContactRequestDto): Promise<ContactRequestDocument> {
        const contactRequest = new this.contactRequestModel({
            ...createDto,
            status: 'PENDING',
        });

        const savedRequest = await contactRequest.save();

        // 이메일 전송 (비동기 처리, 실패해도 문의 접수는 완료)
        this.emailService
            .sendContactRequestEmail({
                name: createDto.managerName,
                company: createDto.companyName,
                email: createDto.email,
                phone: createDto.phone,
                message: createDto.message,
                attachmentUrl: createDto.attachmentUrl,
                submittedAt: (savedRequest as any).createdAt,
            })
            .catch((error) => {
                this.logger.error(`이메일 전송 실패: ${error.message}`, error.stack);
            });

        return savedRequest;
    }

    /**
     * 회사 연락처 정보 조회 (공개 API)
     * DB에서 회사 정보를 조회하거나, 없으면 기본값 반환
     */
    async getContactInfo(): Promise<ContactInfoResponseDto> {
        const companyInfo: any = await this.companyInfoModel.findOne().exec();

        // DB에 회사 정보가 없으면 기본값 반환
        if (!companyInfo) {
            this.logger.warn('DB에 회사 정보가 없습니다. 기본값을 반환합니다.');
            return {
                companyName: 'Korea Kitagawa Co., Ltd.',
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
        }

        // DB에서 가져온 정보 반환
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
                type: loc.type,
                address: loc.address,
                phone: loc.phone,
                fax: loc.fax,
                coordinates: loc.coordinates,
            })),
        };
    }
}
