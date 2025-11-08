import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { CompanyController } from '../company.controller';
import { CompanyService } from '../company.service';
import { expectStandardResponse } from '../../../../test/helpers/test-helpers';

describe('CompanyController (e2e)', () => {
    let app: INestApplication;

    const mockCompanyService = {
        getCompanyInfo: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [CompanyController],
            providers: [
                {
                    provide: CompanyService,
                    useValue: mockCompanyService,
                },
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/company/info', () => {
        it('should return company information', async () => {
            const mockCompanyInfo = {
                greeting: {
                    title: 'CEO Greeting',
                    titleKo: '대표 인사말',
                    content: 'Welcome to Korea Kitagawa...',
                    contentKo: '(주) 한국 기타가와를 찾아주셔서 감사합니다...',
                    ceoName: '최민형',
                },
                vision: 'To be the leading provider...',
                visionKo: '대한민국 최고의 정밀 가공 솔루션 제공 기업',
                mission: 'Provide high-quality products and exceptional customer service',
                missionKo: '고품질 제품과 탁월한 고객 서비스 제공',
            };

            mockCompanyService.getCompanyInfo.mockResolvedValue(mockCompanyInfo);

            const response = await request(app.getHttpServer()).get('/api/company/info').expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('회사 정보 조회 성공');
            expect(response.body.data).toHaveProperty('greeting');
            expect(response.body.data).toHaveProperty('vision');
            expect(response.body.data).toHaveProperty('visionKo');
            expect(response.body.data).toHaveProperty('mission');
            expect(response.body.data).toHaveProperty('missionKo');
            expect(response.body.data.greeting).toHaveProperty('title');
            expect(response.body.data.greeting).toHaveProperty('titleKo');
            expect(response.body.data.greeting).toHaveProperty('content');
            expect(response.body.data.greeting).toHaveProperty('contentKo');
            expect(response.body.data.greeting).toHaveProperty('ceoName');
        });
    });
});
