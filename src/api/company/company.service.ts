import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CompanyInfo, CompanyInfoDocument } from '../../schemas/company-info.schema';
import { CompanyInfoResponseDto } from './dto/response/company-info-response.dto';

/**
 * Company Public Service
 * 회사 정보 조회 (회사 소개, 연혁, 인증서 등)
 */
@Injectable()
export class CompanyService {
    constructor(
        @InjectModel(CompanyInfo.name)
        private readonly companyInfoModel: Model<CompanyInfoDocument>,
    ) {}

    /**
     * 회사 정보 조회 (Singleton - 단일 문서)
     */
    async getCompanyInfo(): Promise<CompanyInfoResponseDto> {
        let companyInfo: CompanyInfoDocument | null = await this.companyInfoModel.findOne().exec();

        // 문서가 없으면 기본 데이터 생성
        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        return this.toResponseDto(companyInfo);
    }

    /**
     * 기본 회사 정보 생성
     */
    private async createDefaultCompanyInfo(): Promise<CompanyInfoDocument> {
        const defaultInfo = new this.companyInfoModel({
            greeting: {
                title: 'CEO Greeting',
                titleKo: '대표 인사말',
                content:
                    'Welcome to Korea Kitagawa. We are committed to providing the best products and services to our customers.',
                contentKo:
                    '(주) 한국 기타가와를 찾아주셔서 감사합니다. 저희는 고객에게 최고의 제품과 서비스를 제공하기 위해 최선을 다하고 있습니다.',
                ceoName: '최민형',
            },
            history: [
                {
                    year: '2020',
                    month: '01',
                    description: 'Established Korea Kitagawa',
                    descriptionKo: '(주) 한국 기타가와 설립',
                },
                {
                    year: '2021',
                    month: '06',
                    description: 'Started official partnership with Kitagawa Japan',
                    descriptionKo: '일본 기타가와와 공식 파트너십 체결',
                },
                {
                    year: '2023',
                    month: '03',
                    description: 'Opened Ansan Service Center',
                    descriptionKo: '안산 서비스 센터 개소',
                },
            ],
            vision: 'To be the leading provider of precision machining solutions in Korea',
            visionKo: '대한민국 최고의 정밀 가공 솔루션 제공 기업',
            mission: 'Provide high-quality products and exceptional customer service',
            missionKo: '고품질 제품과 탁월한 고객 서비스 제공',
            certifications: [
                {
                    name: 'ISO 9001:2015',
                    nameKo: 'ISO 9001:2015 품질경영시스템 인증',
                    issuer: 'Korea Quality Assurance',
                    issuerKo: '한국품질보증',
                    issuedDate: '2021-05-15',
                },
            ],
            isActive: true,
        });

        return await defaultInfo.save();
    }

    /**
     * Entity to DTO 변환
     */
    private toResponseDto(companyInfo: CompanyInfoDocument): CompanyInfoResponseDto {
        return {
            greeting: companyInfo.greeting
                ? {
                      title: companyInfo.greeting.title,
                      titleKo: companyInfo.greeting.titleKo,
                      content: companyInfo.greeting.content,
                      contentKo: companyInfo.greeting.contentKo,
                      ceoName: companyInfo.greeting.ceoName,
                      ceoSignatureUrl: companyInfo.greeting.ceoSignatureUrl,
                  }
                : undefined,
            history: companyInfo.history.map((item) => ({
                year: item.year,
                month: item.month,
                description: item.description,
                descriptionKo: item.descriptionKo,
            })),
            vision: companyInfo.vision,
            visionKo: companyInfo.visionKo,
            mission: companyInfo.mission,
            missionKo: companyInfo.missionKo,
            certifications: companyInfo.certifications.map((cert) => ({
                name: cert.name,
                nameKo: cert.nameKo,
                issuer: cert.issuer,
                issuerKo: cert.issuerKo,
                issuedDate: cert.issuedDate,
                certificateUrl: cert.certificateUrl,
            })),
        };
    }
}
