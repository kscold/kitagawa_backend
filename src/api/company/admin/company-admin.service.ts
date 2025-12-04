import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CompanyInfo, CompanyInfoDocument } from '../../../schema/company-info.schema';

import { CompanyUpdateInfoRequestDto } from './dto/request/company-update-info-request.dto';
import { CompanyGreetingUpdateRequestDto } from './dto/request/company-greeting-update-request.dto';

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
    async updateCompanyInfo(updateDto: CompanyUpdateInfoRequestDto) {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        // 수정
        if (updateDto.vision !== undefined) companyInfo.vision = updateDto.vision;
        if (updateDto.mission !== undefined) companyInfo.mission = updateDto.mission;

        return await companyInfo.save();
    }

    /**
     * 인사말 수정
     */
    async updateGreeting(greetingDto: CompanyGreetingUpdateRequestDto) {
        let companyInfo = await this.companyInfoModel.findOne().exec();

        if (!companyInfo) {
            companyInfo = await this.createDefaultCompanyInfo();
        }

        companyInfo.greeting = {
            title: greetingDto.title,
            content: greetingDto.content,
            ceoName: greetingDto.ceoName,
            ceoSignatureUrl: greetingDto.ceoSignatureUrl,
        };

        return await companyInfo.save();
    }

    /**
     * 기본 회사 정보 생성
     */
    private async createDefaultCompanyInfo() {
        const defaultInfo = new this.companyInfoModel({
            greeting: {
                title: 'CEO Greeting',
                content:
                    'Welcome to Korea Kitagawa. We are committed to providing the best products and services to our customers.',
                ceoName: '최민형',
            },
            vision: 'To be the leading provider of precision machining solutions in Korea',
            mission: 'Provide high-quality products and exceptional customer service',
            isActive: true,
        });

        return await defaultInfo.save();
    }
}
