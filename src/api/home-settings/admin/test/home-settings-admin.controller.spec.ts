import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { HomeSettingsAdminController } from '../home-settings-admin.controller';
import { HomeSettingsAdminService } from '../home-settings-admin.service';
import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

describe('HomeSettingsAdminController (e2e)', () => {
    let app: INestApplication;

    const mockHomeSettingsAdminService = {
        getSettings: jest.fn(),
        updateIntroduction: jest.fn(),
        addMainImage: jest.fn(),
        removeMainImage: jest.fn(),
        updateImageOrder: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [HomeSettingsAdminController],
            providers: [
                {
                    provide: HomeSettingsAdminService,
                    useValue: mockHomeSettingsAdminService,
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

    describe('GET /api/home-settings-admin', () => {
        it('should return home settings for admin', async () => {
            const mockSettings = {
                mainImages: [
                    {
                        url: 'https://example.com/image.jpg',
                        order: 0,
                        alt: 'Banner',
                        altKo: '배너',
                    },
                ],
                introduction: {
                    title: 'Welcome',
                    titleKo: '환영합니다',
                    description: 'Description',
                    descriptionKo: '설명',
                },
                isActive: true,
            };

            mockHomeSettingsAdminService.getSettings.mockResolvedValue(mockSettings);

            const response = await request(app.getHttpServer())
                .get('/api/home-settings-admin')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('홈 설정 조회 성공');
        });
    });

    describe('PATCH /api/home-settings-admin/introduction', () => {
        it('should update introduction', async () => {
            const updateDto = {
                title: 'New Title',
                titleKo: '새로운 제목',
                description: 'New Description',
                descriptionKo: '새로운 설명',
            };

            mockHomeSettingsAdminService.updateIntroduction.mockResolvedValue({
                introduction: updateDto,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/home-settings-admin/introduction')
                .set('Authorization', 'Bearer mock-token')
                .send(updateDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('홈 소개가 업데이트되었습니다');
        });
    });

    describe('POST /api/home-settings-admin/main-images', () => {
        it('should add main image', async () => {
            const imageData = {
                url: 'https://example.com/new-image.jpg',
                alt: 'New Image',
                altKo: '새 이미지',
            };

            mockHomeSettingsAdminService.addMainImage.mockResolvedValue({
                mainImages: [imageData],
            });

            const response = await request(app.getHttpServer())
                .post('/api/home-settings-admin/main-images')
                .set('Authorization', 'Bearer mock-token')
                .send(imageData)
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);
            expect(response.body.message).toBe('대표 이미지가 추가되었습니다');
        });
    });

    describe('DELETE /api/home-settings-admin/main-images/:imageUrl', () => {
        it('should remove main image', async () => {
            const encodedUrl = encodeURIComponent('https://example.com/image.jpg');

            mockHomeSettingsAdminService.removeMainImage.mockResolvedValue({
                mainImages: [],
            });

            const response = await request(app.getHttpServer())
                .delete(`/api/home-settings-admin/main-images/${encodedUrl}`)
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('대표 이미지가 삭제되었습니다');
        });
    });

    describe('PATCH /api/home-settings-admin/main-images/order', () => {
        it('should update image order', async () => {
            const orderData = {
                imageUrls: [
                    'https://example.com/image1.jpg',
                    'https://example.com/image2.jpg',
                    'https://example.com/image3.jpg',
                ],
            };

            mockHomeSettingsAdminService.updateImageOrder.mockResolvedValue({
                mainImages: orderData.imageUrls.map((url, index) => ({
                    url,
                    order: index,
                })),
            });

            const response = await request(app.getHttpServer())
                .patch('/api/home-settings-admin/main-images/order')
                .set('Authorization', 'Bearer mock-token')
                .send(orderData)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('이미지 순서가 변경되었습니다');
        });
    });
});
