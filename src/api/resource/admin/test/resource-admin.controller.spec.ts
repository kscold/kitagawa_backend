import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';

import { AdminJwtAuthGuard } from '../../../../common/guard/admin-jwt-auth.guard';
import { MockAdminJwtAuthGuard } from '../../../../../test/helpers/mock-auth-guard';
import { expectStandardResponse } from '../../../../../test/helpers/test-helpers';

import { ResourceAdminController } from '../resource-admin.controller';

import { ResourceAdminService } from '../resource-admin.service';

describe('ResourceAdminController (e2e)', () => {
    let app: INestApplication;

    const mockResourceAdminService = {
        findAll: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [ResourceAdminController],
            providers: [
                {
                    provide: ResourceAdminService,
                    useValue: mockResourceAdminService,
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

    describe('GET /api/resource-admin', () => {
        it('should return paginated resources', async () => {
            mockResourceAdminService.findAll.mockResolvedValue({
                resources: [
                    {
                        _id: '1',
                        title: 'Test Resource',
                        type: 'CATALOG',
                        isActive: true,
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
                .get('/api/resource-admin')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 목록 조회 성공');
            expect(response.body.data).toHaveProperty('items');
            expect(response.body.data).toHaveProperty('pagination');
        });
    });

    describe('GET /api/resource-admin/:id', () => {
        it('should return resource details', async () => {
            const mockResource = {
                _id: 'resource-id',
                title: 'Test Resource',
                type: 'CATALOG',
                file: {
                    url: 'https://example.com/file.pdf',
                    fileName: 'file.pdf',
                },
                isActive: true,
            };

            mockResourceAdminService.findById.mockResolvedValue(mockResource);

            const response = await request(app.getHttpServer())
                .get('/api/resource-admin/resource-id')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 조회 성공');
            expect(response.body.data).toHaveProperty('title');
        });
    });

    describe('POST /api/resource-admin', () => {
        it('should create a resource', async () => {
            const createDto = {
                title: 'New Resource',
                type: 'CATALOG',
                file: {
                    url: 'https://example.com/file.pdf',
                    fileName: 'file.pdf',
                },
            };

            mockResourceAdminService.create.mockResolvedValue({
                _id: 'new-resource-id',
                ...createDto,
            });

            const response = await request(app.getHttpServer())
                .post('/api/resource-admin')
                .set('Authorization', 'Bearer mock-token')
                .send(createDto)
                .expect(HttpStatus.CREATED);

            expectStandardResponse(response, HttpStatus.CREATED);
            expect(response.body.message).toBe('자료 생성 성공');
        });
    });

    describe('PATCH /api/resource-admin/:id', () => {
        it('should update resource', async () => {
            const updateDto = {
                title: 'Updated Resource',
            };

            mockResourceAdminService.update.mockResolvedValue({
                _id: 'resource-id',
                ...updateDto,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/resource-admin/resource-id')
                .set('Authorization', 'Bearer mock-token')
                .send(updateDto)
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 수정 성공');
        });
    });

    describe('DELETE /api/resource-admin/:id', () => {
        it('should delete resource', async () => {
            mockResourceAdminService.delete.mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .delete('/api/resource-admin/resource-id')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 삭제 성공');
        });
    });

    describe('PATCH /api/resource-admin/:id/activate', () => {
        it('should activate resource', async () => {
            mockResourceAdminService.activate.mockResolvedValue({
                _id: 'resource-id',
                isActive: true,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/resource-admin/resource-id/activate')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 활성화 성공');
        });
    });

    describe('PATCH /api/resource-admin/:id/deactivate', () => {
        it('should deactivate resource', async () => {
            mockResourceAdminService.deactivate.mockResolvedValue({
                _id: 'resource-id',
                isActive: false,
            });

            const response = await request(app.getHttpServer())
                .patch('/api/resource-admin/resource-id/deactivate')
                .set('Authorization', 'Bearer mock-token')
                .expect(HttpStatus.OK);

            expectStandardResponse(response);
            expect(response.body.message).toBe('자료 비활성화 성공');
        });
    });
});
