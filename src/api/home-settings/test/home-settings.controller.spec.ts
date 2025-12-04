import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { HomeSettingsController } from '../home-settings.controller';

import { HomeSettingsService } from '../home-settings.service';

import { expectStandardResponse } from '../../../../test/helpers/test-helpers';

describe('HomeSettingsController (e2e)', () => {
    let app: INestApplication;

    const mockHomeSettingsService = {
        getSettings: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [HomeSettingsController],
            providers: [
                {
                    provide: HomeSettingsService,
                    useValue: mockHomeSettingsService,
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

    describe('GET /api/home-settings', () => {
        it('should return home settings', async () => {
            const mockSettings = {
                mainImages: [
                    {
                        url: 'https://example.com/images/main-banner-1.jpg',
                        order: 0,
                        alt: 'Main Banner 1',
                        altKo: '메인 배너 1',
                    },
                ],
                introduction: {
                    title: 'Welcome to Kitagawa',
                    titleKo: '키타가와에 오신 것을 환영합니다',
                    description: 'Leading provider of precision machining solutions',
                    descriptionKo: '정밀 가공 솔루션의 선두 기업',
                },
                isActive: true,
            };

            mockHomeSettingsService.getSettings.mockResolvedValue(mockSettings);

            const response = await request(app.getHttpServer()).get('/api/home-settings').expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('홈 설정 조회 성공');
            expect(response.body.data).toHaveProperty('mainImages');
            expect(response.body.data).toHaveProperty('introduction');
            expect(response.body.data).toHaveProperty('isActive');
            expect(Array.isArray(response.body.data.mainImages)).toBe(true);
        });
    });
});
