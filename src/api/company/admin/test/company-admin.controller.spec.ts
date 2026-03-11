import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

import { CompanyAdminController } from '../company-admin.controller';

import { CompanyAdminService } from '../company-admin.service';

describe('CompanyAdminController (e2e)', () => {
    let app: INestApplication;

    const mockCompanyAdminService = {
        getCompanyInfo: jest.fn(),
        updateCompanyInfo: jest.fn(),
        updateGreeting: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [CompanyAdminController],
            providers: [
                {
                    provide: CompanyAdminService,
                    useValue: mockCompanyAdminService,
                },
            ],
        })
            .overrideGuard(AdminJwtAuthGuard)
            .useClass(MockAdminJwtAuthGuard)
            .compile();

        app = moduleFixture.createNestApplication();
        app.setGlobalPrefix('api');
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('GET /api/company-admin', () => {
        it('should return company information for admin', async () => {
            const mockCompanyInfo = {
                greeting: {
                    title: 'CEO Greeting',
                    titleKo: '대표 인사말',
                    content: 'Welcome...',
                    contentKo: '환영합니다...',
                    ceoName: '최민형',
                },
                vision: 'To be the leading provider...',
                visionKo: '대한민국 최고의 기업',
                mission: 'Provide quality',
                missionKo: '품질 제공',
            };

            mockCompanyAdminService.getCompanyInfo.mockResolvedValue(mockCompanyInfo);

            const response = await request(app.getHttpServer())
                .get('/api/company-admin')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('회사 정보 조회 성공');
            expect(response.body.data).toHaveProperty('greeting');
            expect(response.body.data).toHaveProperty('vision');
            expect(response.body.data).toHaveProperty('mission');
        });
    });

    describe('PATCH /api/company-admin', () => {
        it('should update company basic information', async () => {
            const updateDto = {
                vision: 'Updated Vision',
                visionKo: '업데이트된 비전',
                mission: 'Updated Mission',
                missionKo: '업데이트된 미션',
            };

            mockCompanyAdminService.updateCompanyInfo.mockResolvedValue({
                ...updateDto,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/company-admin')
                .set('Authorization', 'Bearer mock-token')
                .send(updateDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('회사 정보가 수정되었습니다');
            expect(response.body.data).toHaveProperty('vision', 'Updated Vision');
        });
    });

    describe('PATCH /api/company-admin/greeting', () => {
        it('should update greeting', async () => {
            const greetingDto = {
                title: 'New Greeting',
                titleKo: '새로운 인사말',
                content: 'New content',
                contentKo: '새로운 내용',
                ceoName: '김철수',
            };

            mockCompanyAdminService.updateGreeting.mockResolvedValue({
                greeting: greetingDto,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/company-admin/greeting')
                .set('Authorization', 'Bearer mock-token')
                .send(greetingDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('인사말이 수정되었습니다');
        });
    });
});
