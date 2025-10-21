import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CompanyInfo, CompanyInfoDocument } from '../../../schemas/company-info.schema';

import { UpdateCompanyInfoRequestDto } from '../dto/request/update-company-info-request.dto';
import { UpdateGreetingRequestDto } from '../dto/request/update-greeting-request.dto';
import { CreateHistoryItemDto } from '../dto/request/create-history-item.dto';
import { CreateCertificationItemDto } from '../dto/request/create-certification-item.dto';

/**
 * Company Admin Service
 * 회사 정보 관리 (관리자 전용)
 */
@Injectable()
export class CompanyAdminService {
    constructor(
        @InjectModel(CompanyInfo.name)
        private readonly companyInfoModel: Model<CompanyInfoDocument>,
    ) {}

    /**
     * 회사 정보 조회 (관리자용)
     */
    async getCompanyInfo() {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            // 문서가 없으면 기본 데이터 생성
            companyInfo = await this.createDefaultCompanyInfo();
        }

        return companyInfo;
    }

    /**
     * 회사 기본 정보 수정 (vision, mission)
     */
    async updateCompanyInfo(updateDto: UpdateCompanyInfoRequestDto) {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        // 수정
        if (updateDto.vision !== undefined) companyInfo.vision = updateDto.vision;
        if (updateDto.visionKo !== undefined) companyInfo.visionKo = updateDto.visionKo;
        if (updateDto.mission !== undefined) companyInfo.mission = updateDto.mission;
        if (updateDto.missionKo !== undefined) companyInfo.missionKo = updateDto.missionKo;

        return await companyInfo.save();
    }

    /**
     * 인사말 수정
     */
    async updateGreeting(greetingDto: UpdateGreetingRequestDto) {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        companyInfo.greeting = {
            title: greetingDto.title,
            titleKo: greetingDto.titleKo,
            content: greetingDto.content,
            contentKo: greetingDto.contentKo,
            ceoName: greetingDto.ceoName,
            ceoSignatureUrl: greetingDto.ceoSignatureUrl,
        };

        return await companyInfo.save();
    }

    /**
     * 연혁 추가
     */
    async addHistory(historyDto: CreateHistoryItemDto) {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        companyInfo.history.push({
            year: historyDto.year,
            month: historyDto.month,
            description: historyDto.description,
            descriptionKo: historyDto.descriptionKo,
        });

        // 연도, 월 순으로 정렬 (최신순)
        companyInfo.history.sort((a, b) => {
            const yearDiff = parseInt(b.year) - parseInt(a.year);
            if (yearDiff !== 0) return yearDiff;
            return parseInt(b.month || '00') - parseInt(a.month || '00');
        });

        return await companyInfo.save();
    }

    /**
     * 연혁 삭제
     */
    async deleteHistory(index: number) {
        const companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            throw new NotFoundException('회사 정보를 찾을 수 없습니다');
        }

        if (index < 0 || index >= companyInfo.history.length) {
            throw new BadRequestException('유효하지 않은 인덱스입니다');
        }

        companyInfo.history.splice(index, 1);

        return await companyInfo.save();
    }

    /**
     * 인증서 추가
     */
    async addCertification(certDto: CreateCertificationItemDto) {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        companyInfo.certifications.push({
            name: certDto.name,
            nameKo: certDto.nameKo,
            issuer: certDto.issuer,
            issuerKo: certDto.issuerKo,
            issuedDate: certDto.issuedDate,
            certificateUrl: certDto.certificateUrl,
        });

        return await companyInfo.save();
    }

    /**
     * 인증서 삭제
     */
    async deleteCertification(index: number) {
        const companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            throw new NotFoundException('회사 정보를 찾을 수 없습니다');
        }

        if (index < 0 || index >= companyInfo.certifications.length) {
            throw new BadRequestException('유효하지 않은 인덱스입니다');
        }

        companyInfo.certifications.splice(index, 1);

        return await companyInfo.save();
    }

    /**
     * 기본 회사 정보 생성
     */
    private async createDefaultCompanyInfo() {
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
}
