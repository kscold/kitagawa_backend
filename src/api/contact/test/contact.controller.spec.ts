import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { expectStandardResponse } from '../../../../test/helpers/test-helpers';

import { ContactController } from '../contact.controller';

import { ContactService } from '../contact.service';

describe('ContactController (e2e)', () => {
    let app: INestApplication;

    const mockContactService = {
        createContactRequest: jest.fn(),
        getContactInfo: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ContactController],
            providers: [
                {
                    provide: ContactService,
                    useValue: mockContactService,
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

    describe('POST /api/contact/service-request', () => {
        it('should create contact request', async () => {
            const createDto = {
                contactPerson: '홍길동',
                companyName: '테스트 회사',
                email: 'test@example.com',
                phoneNumber: '01012345678',
                message: '문의사항입니다',
                privacyAgreement: true,
            };

            const mockContactRequest = {
                _id: '507f1f77bcf86cd799439011',
                ...createDto,
                createdAt: new Date('2025-01-15T10:30:00.000Z'),
            };

            mockContactService.createContactRequest.mockResolvedValue(mockContactRequest);

            const response = await request(app.getHttpServer())
                .post('/api/contact/service-request')
                .send(createDto)
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);
            expect(response.body.message).toBe('서비스 문의가 성공적으로 접수되었습니다');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data).toHaveProperty('submittedAt');
        });
    });

    describe('GET /api/contact/info', () => {
        it('should return contact information', async () => {
            const mockContactInfo = {
                companyName: 'Korea Kitagawa Co., Ltd.',
                companyNameKo: '(주) 한국 기타가와',
                ceo: '최민형',
                address: '서울 금천구 가산디지털1로 168',
                phone: '02-2026-2222',
                mobile: '010-3616-9973',
                email: 'kiw@kitagawa.co.kr',
                locations: [
                    {
                        name: 'Headquarters',
                        nameKo: '본사',
                        type: 'headquarters',
                        address: '서울 금천구 가산디지털1로 168',
                        phone: '02-2026-2222',
                        coordinates: { lat: 37.4812845, lng: 126.8821449 },
                    },
                ],
            };

            mockContactService.getContactInfo.mockResolvedValue(mockContactInfo);

            const response = await request(app.getHttpServer()).get('/api/contact/info').expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('연락처 정보 조회 성공');
            expect(response.body.data).toHaveProperty('companyName');
            expect(response.body.data).toHaveProperty('phone');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data).toHaveProperty('locations');
            expect(Array.isArray(response.body.data.locations)).toBe(true);
        });
    });
});
