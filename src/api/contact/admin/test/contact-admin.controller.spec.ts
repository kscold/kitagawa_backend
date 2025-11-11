import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';

import { ContactAdminController } from '../contact-admin.controller';

import { ContactAdminService } from '../contact-admin.service';

import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

describe('ContactAdminController (e2e)', () => {
    let app: INestApplication;

    const mockContactAdminService = {
        findAll: jest.fn(),
        findById: jest.fn(),
        updateStatus: jest.fn(),
        delete: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ContactAdminController],
            providers: [
                {
                    provide: ContactAdminService,
                    useValue: mockContactAdminService,
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

    describe('GET /api/contact-admin', () => {
        it('should return paginated contacts', async () => {
            mockContactAdminService.findAll.mockResolvedValue({
                contacts: [
                    {
                        _id: '1',
                        contactPerson: '홍길동',
                        companyName: '테스트 회사',
                        email: 'test@example.com',
                        phoneNumber: '01012345678',
                        message: '문의사항',
                        status: 'PENDING',
                        createdAt: new Date(),
                    },
                ],
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalItems: 1,
                    itemsPerPage: 20,
                    hasNextPage: false,
                    hasPreviousPage: false,
                },
            });

            const response = await request(app.getHttpServer())
                .get('/api/contact-admin')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('문의 목록 조회 성공');
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
        });
    });

    describe('GET /api/contact-admin/:id', () => {
        it('should return contact details', async () => {
            const mockContact = {
                _id: 'contact-id',
                contactPerson: '홍길동',
                companyName: '테스트 회사',
                email: 'test@example.com',
                phoneNumber: '01012345678',
                message: '문의사항',
                status: 'PENDING',
                createdAt: new Date(),
            };

            mockContactAdminService.findById.mockResolvedValue(mockContact);

            const response = await request(app.getHttpServer())
                .get('/api/contact-admin/contact-id')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('문의 조회 성공');
            expect(response.body.data).toHaveProperty('contactPerson');
        });
    });

    describe('PATCH /api/contact-admin/:id/status', () => {
        it('should update contact status', async () => {
            const updateDto = {
                status: 'COMPLETED',
                adminNote: '처리 완료',
            };

            mockContactAdminService.updateStatus.mockResolvedValue({
                _id: 'contact-id',
                status: 'COMPLETED',
                adminNote: '처리 완료',
            });

            const response = await request(app.getHttpServer())
                .patch('/api/contact-admin/contact-id/status')
                .set('Authorization', 'Bearer mock-token')
                .send(updateDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('문의 상태 업데이트 성공');
        });
    });

    describe('DELETE /api/contact-admin/:id', () => {
        it('should delete contact', async () => {
            mockContactAdminService.delete.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .delete('/api/contact-admin/contact-id')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('문의 삭제 성공');
        });
    });
});
