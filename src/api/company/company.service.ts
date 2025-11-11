import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CompanyInfo, CompanyInfoDocument } from '../../schemas/company-info.schema';

import { CompanyInfoResponseDto } from './dto/response/company-info-response.dto';

/**
 * Company Public Service
 * 회사 정보 조회 (회사 소개)
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
        const companyInfo: CompanyInfoDocument = await this.companyInfoModel.findOne().exec();

        return this.toResponseDto(companyInfo);
    }

    /**
     * Entity to DTO 변환
     */
    private toResponseDto(companyInfo: CompanyInfoDocument): CompanyInfoResponseDto {
        return {
            greeting: companyInfo.greeting
                ? {
                      title: companyInfo.greeting.title,
                      content: companyInfo.greeting.content,
                      ceoName: companyInfo.greeting.ceoName,
                      ceoSignatureUrl: companyInfo.greeting.ceoSignatureUrl,
                  }
                : undefined,
            vision: companyInfo.vision,
            mission: companyInfo.mission,
        };
    }
}
